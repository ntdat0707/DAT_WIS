import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

// import { CustomerModel, sequelize } from '../../../repositories/models';
import { validate } from '../../../ultils/validator';
import { buildSuccessMessage } from '../../../ultils/response-messages';
import { CustomError } from '../../../ultils/error-handlers';
import { MockCustomerModel } from '../../../repositories/postresql/models';
import { createAccessToken, verifyAcessToken } from '../../../ultils/jwt';

import { registerSchema, loginSchema } from '../configs/validate-schemas';
import { NODE_NAME } from '../configs/consts';
import { sendEmail } from '../../../ultils/emailer';
require('dotenv').config();

export class CustomerController {
  constructor() {}

  /**
   * @swagger
   * definitions:
   *   register:
   *       required:
   *           - email
   *           - name
   *           - password
   *       properties:
   *           email:
   *               type: string
   *               uniqueItems: true
   *           name:
   *               type: string
   *           age:
   *               type: integer
   *           password:
   *               type: string
   *
   */

  /**
   * @swagger
   * /customer/register:
   *   post:
   *     tags:
   *       - Customer
   *     name: register
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/register'
   *     responses:
   *       200:
   *         description: register success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public register = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: any = null;
    /*for (let i = 0; i < 2; i++) {
      const cc = await sendEmail({
        receivers: 'lvtrong19931@gmail.com', //'huy@bookoke.com',
        subject: 'Thông báo nhận khuyến mãi từ Bookoke nhân dịp lễ gì đó ' + new Date() + 'time ' + i,
        type: 'text',
        message:
          'Xin chào quý khách, Cảm ơn quý khách đã đăng ký tài khoản trong hệ thống của chúng tôi, mã khuyến mãi là A6969-9-9 ' +
          new Date() +
          ' Test send mail gun from Notification Service - time ' +
          i,
        cc: ['emospa02@gmail.com']
      });
      console.log('push email =========================', cc);
    }*/
    try {
      let data = (({ name, email, age, password }) => ({
        name,
        email,
        age,
        password
      }))(req.body);
      //test token
      // const token = await createAccessToken({
      //   userId: 'aaa',
      //   userName: 'Trọng lv',
      //   userType: 'customer',
      //   refreshToken: 'asdasd'
      // });
      // const ensc = await verifyAcessToken(token);
      // console.log(token, '------------------------------', ensc);

      const validateErrors = validate(data, registerSchema);
      if (validateErrors) return next(new CustomError(validateErrors, NODE_NAME, HttpStatus.BAD_REQUEST));
      const customer = await MockCustomerModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   login:
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
   * /customer/login:
   *   post:
   *     tags:
   *       - Customer
   *     name: register
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/login'
   *     responses:
   *       200:
   *         description: login success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      let profile = (({ email, password }) => ({
        email,
        password
      }))(req.body);
      const validateErrors = validate(profile, loginSchema);
      if (validateErrors) return next(new CustomError(validateErrors, NODE_NAME, HttpStatus.BAD_REQUEST));
      return res.status(HttpStatus.OK).send({});
    } catch (error) {
      return next(error);
    }
  }
}
