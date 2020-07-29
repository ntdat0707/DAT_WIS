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
import { createBusinessAccountSchema, loginSchema, refreshTokensChema } from '../configs/validate-schemas';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';
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
      if (transaction) await transaction.rollback();
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
}
