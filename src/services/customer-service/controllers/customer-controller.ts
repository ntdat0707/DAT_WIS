//
//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { CustomerModel } from '../../../repositories/postgres/models';

import { createCustomerSchema } from '../configs/validate-schemas';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { customerIdSchema, loginSchema } from '../configs/validate-schemas/customer';
import { paginate } from '../../../utils/paginator';
import { FindOptions } from 'sequelize/types';
import { hash, compare } from 'bcryptjs';
import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import { IAccessTokenData, IRefreshTokenData, createAccessToken, createRefreshToken } from '../../../utils/jwt';
import * as ejs from 'ejs';
import * as path from 'path';
import { ICustomerRegisterAccountTemplate } from '../../../utils/emailer/templates/customer-register-account';
import { sendEmail } from '../../../utils/emailer';
import { generatePWD } from '../../../utils/lib/generatePassword';
export class CustomerController {
  /**
   * @swagger
   * definitions:
   *   customerCreate:
   *       properties:
   *           firstName:
   *               type: string
   *           lastName:
   *               type: string
   *           gender:
   *               type: integer
   *               required: true
   *               enum: [0, 1, 2]
   *           phone:
   *               required: true
   *               type: string
   *           email:
   *               type: string
   *           birthDate:
   *               type: string
   *           passportNumber:
   *               type: string
   *           address:
   *               type: string
   *
   *
   */

  /**
   * @swagger
   * /customer/create:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createCustomer
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/customerCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email ? req.body.email : null,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address
      };
      const validateErrors = validate(data, createCustomerSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      data.companyId = res.locals.staffPayload.companyId;
      const existPhone = await CustomerModel.findOne({ where: { phone: data.phone } });
      if (existPhone) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
      if (req.body.email) {
        const existEmail = await CustomerModel.findOne({ where: { email: data.email, companyId: data.companyId } });
        if (existEmail) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
      }
      const password = await generatePWD(8);
      data.password = await hash(password, PASSWORD_SALT_ROUNDS);
      const customer = await CustomerModel.create(data);
      const dataSendMail: ICustomerRegisterAccountTemplate = {
        customerEmail: data.email,
        customerName: `${data.firstName} ${data.lastName}`,
        password: password
      };
      const pathFile = path.join(process.cwd(), 'src/utils/emailer/templates/customer-register-account.ejs');
      ejs.renderFile(pathFile, dataSendMail, async (err: any, dataEjs: any) => {
        if (!err) {
          await sendEmail({
            receivers: data.email,
            subject: 'Your Login information for Wisere',
            type: 'html',
            message: dataEjs
          });
        }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/all:
   *   get:
   *     summary: Get all customer in a company
   *     description: Get all customer in a company
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getAllCustomerInCompany
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllCustomerInCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customers = await CustomerModel.findAll({
        where: {
          companyId
        }
      });

      return res.status(HttpStatus.OK).send(buildSuccessMessage(customers));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/delete/{customerId}:
   *   delete:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: delete-customer
   *     parameters:
   *     - in: path
   *       name: customerId
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customerId = req.params.customerId;
      const validateErrors = validate(customerId, customerIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const customer = await CustomerModel.findOne({ where: { id: customerId } });
      if (!customer)
        return next(
          new CustomError(customerErrorDetails.E_3001(`customerId ${customerId} not found`), HttpStatus.NOT_FOUND)
        );
      if (companyId !== customer.companyId) {
        return next(
          new CustomError(
            customerErrorDetails.E_3002(`You can not access to company ${customer.companyId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await CustomerModel.destroy({ where: { id: customerId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/get-customers:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getCustomers
   *     parameters:
   *     - in: query
   *       name: pageNum
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageSize
   *       required: true
   *       schema:
   *          type: integer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const { companyId } = res.locals.staffPayload;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        where: {
          companyId: companyId
        }
      };
      const customer = await paginate(
        CustomerModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * /customer/get/{customerId}:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getCustomers
   *     parameters:
   *     - in: path
   *       name: customerId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customerId = req.params.customerId;
      const validateErrors = validate(customerId, customerIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const customer = await CustomerModel.findOne({ where: { id: customerId, companyId: companyId } });
      if (!customer)
        return next(
          new CustomError(customerErrorDetails.E_3001(`customerId ${customerId} not found`), HttpStatus.NOT_FOUND)
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CustomerLogin:
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
   *     name: customer-login
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerLogin'
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
      const customer = await CustomerModel.findOne({ raw: true, where: { email: data.email } });
      if (!customer)
        return next(new CustomError(customerErrorDetails.E_3004('Email or password invalid'), HttpStatus.NOT_FOUND));
      const match = await compare(data.password, customer.password);
      if (!match)
        return next(new CustomError(customerErrorDetails.E_3004('Email or password invalid'), HttpStatus.NOT_FOUND));
      //create tokens

      const accessTokenData: IAccessTokenData = {
        userId: customer.id,
        userName: `${customer.firstName} ${customer.lastName}`,
        userType: 'customer'
      };
      const accessToken = await createAccessToken(accessTokenData);
      const refreshTokenData: IRefreshTokenData = {
        userId: customer.id,
        userName: `${customer.firstName} ${customer.lastName}`,
        userType: 'customer',
        accessToken
      };
      const refreshToken = await createRefreshToken(refreshTokenData);
      const profile = await CustomerModel.scope('safe').findOne({
        where: { email: data.email }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
    } catch (error) {
      return next(error);
    }
  };
}
