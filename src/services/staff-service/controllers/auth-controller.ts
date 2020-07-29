import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createAccessToken, createRefreshToken, IAccessTokenData, IRefreshTokenData } from '../../../utils/jwt';
import { sequelize, StaffModel, CompanyModel } from '../../../repositories/postgres/models';

import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import { createBusinessAccountSchema, loginSchema } from '../configs/validate-schemas';

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
      const refreshTokenData: IRefreshTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff'
      };
      const refreshToken = await createRefreshToken(refreshTokenData);
      const accessTokenData: IAccessTokenData = {
        userId: staff.id,
        userName: staff.fullName,
        userType: 'staff',
        refreshToken
      };
      const accessToken = await createAccessToken(accessTokenData);
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken }));
    } catch (error) {
      return next(error);
    }
  };
}
