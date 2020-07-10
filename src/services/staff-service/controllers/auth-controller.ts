import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { hash } from 'bcryptjs'; //compare
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails } from '../../../utils/response-messages/error-details';
// import { buildSuccessMessage } from '../../../utils/response-messages';
import { StaffModel } from '../../../repositories/postresql/models';

import { NODE_NAME, PASSWORD_SALT_ROUNDS } from '../configs/consts';
import { createBusinessAccountSchema } from '../configs/validate-schemas';

export class AuthController {
  constructor() {}

  /**
   * @swagger
   * definitions:
   *   RegisterBusinessAccount:
   *       required:
   *           - orderId
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
      if (validateErrors) return next(new CustomError(validateErrors, NODE_NAME, HttpStatus.BAD_REQUEST));

      const checkEmailExists = await StaffModel.findOne({ where: { email: data.email } });
      if (checkEmailExists) return next(new CustomError(staffErrorDetails.E_4O1(), NODE_NAME, HttpStatus.BAD_REQUEST));

      //endscrypt password
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      await StaffModel.create({ ...data, ...{ isBusinessAccount: false } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  }
}
