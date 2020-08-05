import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails, generalErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage, buildErrorMessage } from '../../../utils/response-messages';
import { logger } from '../../../utils/logger';
import {
  createAccessToken,
  createRefreshToken,
  IAccessTokenData,
  IRefreshTokenData,
  destroyTokens,
  verifyAcessToken,
  verifyRefreshToken
} from '../../../utils/jwt';
import { sequelize, StaffModel, CompanyModel, LocationModel } from '../../../repositories/postgres/models';

import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import {
  createBusinessAccountSchema,
  loginSchema,
  refreshTokensChema,
  emailSchema,
  changePasswordSchema
} from '../configs/validate-schemas';
import {
  buildEmailTemplate,
  staffRecoveryPasswordTemplate,
  IStaffRecoveryPasswordTemplate
} from '../../../utils/emailer/templates';
import { sendEmail } from '../../../utils/emailer';
import { redis, EKeys } from '../../../repositories/redis';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';
const recoveryPasswordUrlExpiresIn = process.env.RECOVERY_PASSWORD_URL_EXPIRES_IN;

export class AuthController {
  /**
   * @swagger
   * definitions:
   *   RegisterBusinessAccount:
   *       required:
   *           - email
   *           - password
   *           - fullName
   *       properties:
   *           email:
   *               type: string
   *           password:
   *               type: string
   *           fullName:
   *               type: string
   *
   */

  /**
   * @swagger
   * /staff/auth/register-business-account:
   *   post:
   *     tags:
   *       - Staff
   *     name: register-business-account
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/RegisterBusinessAccount'
   *     responses:
   *       200:
   *         description: Sucess
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public registerBusinessAccount = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      // start transaction
      transaction = await sequelize.transaction();
      const data = {
        email: req.body.email,
        fullName: req.body.fullName,
        password: req.body.password
      };

      const validateErrors = validate(data, createBusinessAccountSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      const checkEmailExists = await StaffModel.findOne({ where: { email: data.email } });
      if (checkEmailExists) return next(new CustomError(staffErrorDetails.E_4001(), HttpStatus.BAD_REQUEST));

      //endscrypt password
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      const staffId = uuidv4();
      const companyId = uuidv4();
      await StaffModel.create({ ...data, ...{ isBusinessAccount: true, id: staffId } }, { transaction });
      await CompanyModel.create({ id: companyId, ownerId: staffId }, { transaction });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffLogin:
   *       required:
   *           - email
   *           - password
   *       properties:
   *           email:
   *               type: string
   *           password:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/login:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-login
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffLogin'
   *     responses:
   *       200:
   *         description: Sucess
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        email: req.body.email,
        password: req.body.password
      };
      const validateErrors = validate(data, loginSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.findOne({ raw: true, where: { email: data.email } });
      if (!staff)
        return next(new CustomError(staffErrorDetails.E_4002('Email or password invalid'), HttpStatus.NOT_FOUND));
      const match = await compare(data.password, staff.password);
      if (!match)
        return next(new CustomError(staffErrorDetails.E_4002('Email or password invalid'), HttpStatus.NOT_FOUND));
      //create tokens

      const accessTokenData: IAccessTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff'
      };
      const accessToken = await createAccessToken(accessTokenData);
      const refreshTokenData: IRefreshTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff',
        accessToken
      };
      const refreshToken = await createRefreshToken(refreshTokenData);
      const profile = await StaffModel.scope('safe').findOne({
        where: { email: data.email },
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] }
          }
        ]
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffRefreshToken:
   *       required:
   *           - refreshToken
   *       properties:
   *           refreshToken:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/refresh-tokens:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-refresh-tokens
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffRefreshToken'
   *     responses:
   *       200:
   *         description: Sucess
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputRefreshTokenBearer = req.body.refreshToken;
      const validateErrors = validate(inputRefreshTokenBearer, refreshTokensChema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      if (!inputRefreshTokenBearer.startsWith('Bearer ')) {
        logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0005()) });
        return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_0005()));
      }
      const inputRefreshToken = inputRefreshTokenBearer.slice(7, inputRefreshTokenBearer.length).trimLeft();

      const oldRefreshToken = await verifyRefreshToken(inputRefreshToken);
      if (oldRefreshToken instanceof CustomError) return next(oldRefreshToken);
      const oldAccessToken = await verifyAcessToken(oldRefreshToken.accessToken);
      if (oldAccessToken instanceof CustomError) return next(oldAccessToken);
      const staff = await StaffModel.findOne({ where: { id: oldAccessToken.userId } });
      if (!staff) return next(staffErrorDetails.E_4000());
      const isDestroy = await destroyTokens(inputRefreshToken);
      if (isDestroy instanceof CustomError) return next(isDestroy);

      const newAccessTokenData: IAccessTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff'
      };
      const newAccessToken = await createAccessToken(newAccessTokenData);
      const newRefreshTokenData: IRefreshTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff',
        accessToken: newAccessToken
      };
      const newRefreshToken = await createRefreshToken(newRefreshTokenData);
      return res
        .status(HttpStatus.OK)
        .send(buildSuccessMessage({ accessToken: newAccessToken, refreshToken: newRefreshToken }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffRequestNewPassword:
   *       required:
   *           - email
   *       properties:
   *           email:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/request-new-password:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-request-new-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffRequestNewPassword'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public requestNewPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body.email;
      const validateErrors = validate({ email: email }, emailSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.scope('safe').findOne({ raw: true, where: { email: req.body.email } });
      if (!staff) return next(new CustomError(staffErrorDetails.E_4000('Email not found'), HttpStatus.NOT_FOUND));
      const uuidToken = uuidv4();
      const data: IStaffRecoveryPasswordTemplate = {
        staffName: staff.fullName,
        yourURL: `https://app.wisere.com/forgot-password?token=${uuidToken}`
      };
      const msg = buildEmailTemplate(staffRecoveryPasswordTemplate, data);
      await redis.setData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${uuidToken}`, JSON.stringify({ email: email }), {
        key: 'EX',
        value: recoveryPasswordUrlExpiresIn
      });
      await sendEmail({
        receivers: email,
        subject: 'Recovery password',
        type: 'html',
        message: msg
      });
      res.status(HttpStatus.OK).send(buildSuccessMessage({ msg: 'Please check your email' }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffChangePassword:
   *       required:
   *           - token
   *           - newPassword
   *       properties:
   *           token:
   *               type: string
   *           newPassword:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/change-password:
   *   put:
   *     tags:
   *       - Staff
   *     name: staff-change-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffChangePassword'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = {
        token: req.body.token,
        newPassword: req.body.newPassword
      };
      const validateErrors = validate(body, changePasswordSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const tokenStoraged = await redis.getData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${body.token}`);
      if (!tokenStoraged)
        return next(new CustomError(staffErrorDetails.E_4004('Invalid token'), HttpStatus.UNAUTHORIZED));
      const data = JSON.parse(tokenStoraged);
      const staff = await StaffModel.scope('safe').findOne({ raw: true, where: { email: data.email } });
      if (!staff) return next(new CustomError(staffErrorDetails.E_4000('Email not found'), HttpStatus.NOT_FOUND));
      const password = await hash(body.newPassword, PASSWORD_SALT_ROUNDS);
      await StaffModel.update(
        { password: password },
        {
          where: {
            email: data.email
          }
        }
      );
      await redis.deleteData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${body.token}`);
      res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
