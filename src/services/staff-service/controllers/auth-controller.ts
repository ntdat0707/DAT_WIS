import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { hash, compare } from 'bcryptjs';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createAccessToken, createRefreshToken, IAccessTokenData, IRefreshTokenData } from '../../../utils/jwt';
import { StaffModel } from '../../../repositories/postresql/models';

import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import { createBusinessAccountSchema, loginSchema } from '../configs/validate-schemas';

export class AuthController {
  constructor() {}

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
  public async registerBusinessAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        email: req.body.email,
        fullName: req.body.fullName,
        password: req.body.password
      };

      const validateErrors = validate(data, createBusinessAccountSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      const checkEmailExists = await StaffModel.findOne({ where: { email: data.email } });
      if (checkEmailExists) return next(new CustomError(staffErrorDetails.E_401(), HttpStatus.BAD_REQUEST));

      //endscrypt password
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      await StaffModel.create({ ...data, ...{ isBusinessAccount: true } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  }

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

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        email: req.body.email,
        password: req.body.password
      };
      const validateErrors = validate(data, loginSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.findOne({ raw: true, where: { email: data.email } });
      if (!staff)
        return next(new CustomError(staffErrorDetails.E_402('Email or password invalid'), HttpStatus.NOT_FOUND));
      const match = await compare(data.password, staff.password);
      if (!match)
        return next(new CustomError(staffErrorDetails.E_402('Email or password invalid'), HttpStatus.NOT_FOUND));
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
        refreshToken: refreshToken
      };
      const accessToken = await createAccessToken(accessTokenData);
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken }));
    } catch (error) {
      return next(error);
    }
  }
}
