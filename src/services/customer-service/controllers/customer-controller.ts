import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import {
  customerErrorDetails,
  generalErrorDetails,
  staffErrorDetails
} from '../../../utils/response-messages/error-details';
import {
  CustomerModel,
  CustomerWisereModel,
  StaffModel,
  sequelize,
  ContactModel
} from '../../../repositories/postgres/models';
import {
  createCustomerWisereSchema,
  customerWireseIdSchema,
  updateCustomerWisereSchema,
  loginSchema,
  loginSocialSchema,
  registerCustomerSchema
} from '../configs/validate-schemas';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { paginate } from '../../../utils/paginator';
import { FindOptions, Transaction } from 'sequelize';
import { hash, compare } from 'bcryptjs';
import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import {
  IAccessTokenData,
  IRefreshTokenData,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken
} from '../../../utils/jwt';
import { generatePWD } from '../../../utils/lib/generatePassword';
import { ESocialType } from '../../../utils/consts';
import {
  validateFacebookToken,
  validateGoogleToken,
  validateAppleCode
} from '../../../utils/validator/validate-social-token';
import { generateAppleToken } from '../../../utils/lib/generateAppleToken';
import jwt from 'jsonwebtoken';
import shortid from 'shortid';

export class CustomerController {
  /**
   * @swagger
   * definitions:
   *   MoreEmailContact:
   *       properties:
   *           email:
   *               type: string
   *           type:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   MorePhoneContact:
   *       properties:
   *           phone:
   *               type: string
   *           type:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/create-customer-wisere:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createCustomerWisere
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: firstName
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: lastName
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: gender
   *       type: integer
   *       enum: [0, 1, 2]
   *     - in: "formData"
   *       name: phone
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: email
   *       type: string
   *     - in: "formData"
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: passport
   *       type: string
   *     - in: "formData"
   *       name: address
   *       type: string
   *     - in: "formData"
   *       name: ownerId
   *       type: string
   *     - in: "formData"
   *       name: source
   *       type: string
   *     - in: "formData"
   *       name: label
   *       type: string
   *     - in: "formData"
   *       name: note
   *       type: string
   *     - in: "formData"
   *       name: job
   *       type: string
   *     - in: "formData"
   *       name: "moreEmailContact"
   *       type: array
   *       items:
   *           $ref: '#/definitions/MoreEmailContact'
   *     - in: "formData"
   *       name: "morePhoneContact"
   *       type: array
   *       items:
   *           $ref: '#/definitions/MorePhoneContact'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createCustomerWisere = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email ? req.body.email : null,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        ownerId: req.body.ownerId,
        source: req.body.source,
        note: req.body.note,
        job: req.body.job,
        label: req.body.label,
        moreEmailContact: req.body.moreEmailContact,
        morePhoneContact: req.body.morePhoneContact
      };
      const validateErrors = validate(data, createCustomerWisereSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      data.companyId = res.locals.staffPayload.companyId;
      const existPhone = await CustomerWisereModel.findOne({ where: { phone: data.phone, companyId: data.companyId } });
      if (existPhone) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
      if (data.email) {
        const existEmail = await CustomerWisereModel.findOne({
          where: { email: data.email, companyId: data.companyId }
        });
        if (existEmail) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
      }
      if (data.ownerId) {
        const existStaff = await StaffModel.findOne({
          where: { id: data.ownerId, mainLocationId: res.locals.staffPayload.workingLocationIds }
        });
        if (!existStaff)
          return next(
            new CustomError(staffErrorDetails.E_4000(`staffId ${data.ownerId} not found`), HttpStatus.NOT_FOUND)
          );
      }
      data.code = shortid.generate();
      transaction = await sequelize.transaction();
      const customerWisere = await CustomerWisereModel.create(data, { transaction });
      if (data.moreEmailContact && data.moreEmailContact.length > 0) {
        const arrInsertEmailContact = [];
        for (let i = 0; i < data.moreEmailContact.length; i++) {
          const existEmailCustomer = await CustomerWisereModel.findOne({
            where: { email: data.moreEmailContact[i].email, companyId: data.companyId }
          });
          if (existEmailCustomer) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
          const existEmailContact = await ContactModel.findOne({
            where: { email: data.moreEmailContact[i].email }
          });
          if (existEmailContact) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
          arrInsertEmailContact.push({
            email: data.moreEmailContact[i].email,
            type: data.moreEmailContact[i].type,
            customerWisereId: customerWisere.id
          });
        }
        await ContactModel.bulkCreate(arrInsertEmailContact, { transaction });
      }
      if (data.morePhoneContact && data.morePhoneContact.length > 0) {
        const arrInsertPhoneContact = [];
        for (let i = 0; i < data.morePhoneContact.length; i++) {
          const existPhoneCustomer = await CustomerWisereModel.findOne({
            where: { phone: data.morePhoneContact[i].phone, companyId: data.companyId }
          });
          if (existPhoneCustomer) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
          const existPhoneContact = await ContactModel.findOne({
            where: { phone: data.morePhoneContact[i].phone }
          });
          if (existPhoneContact) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
          arrInsertPhoneContact.push({
            phone: data.morePhoneContact[i].phone,
            type: data.morePhoneContact[i].type,
            customerWisereId: customerWisere.id
          });
        }
        await ContactModel.bulkCreate(arrInsertPhoneContact, { transaction });
      }
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customerWisere));
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   customerWisereUpdate:
   *       properties:
   *           lastName:
   *               type: string
   *           firstName:
   *               type: string
   *           gender:
   *               type: integer
   *               required: true
   *               enum: [0, 1, 2]
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
   * /customer/update-customer-wisere/{customerWisereId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updateCustomerWisere
   *     parameters:
   *     - in: "path"
   *       name: "customerWisereId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/customerWisereUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateCustomerWisere = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address
      };
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(data, updateCustomerWisereSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      let customerWisere = await CustomerWisereModel.findOne({
        where: { id: req.params.customerWisereId, companyId: companyId }
      });
      if (!customerWisere)
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          HttpStatus.NOT_FOUND
        );
      customerWisere = await customerWisere.update(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customerWisere));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/get-all-customer-wisere:
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
  public getAllCustomerWisereInCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customers = await CustomerWisereModel.findAll({
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
   * /customer/delete-customer-wisere/{customerWisereId}:
   *   delete:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: delete-customer
   *     parameters:
   *     - in: path
   *       name: customerWisereId
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
  public deleteCustomerWisere = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(customerWisereId, customerWireseIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const customerWisere = await CustomerWisereModel.findOne({ where: { id: customerWisereId } });
      if (!customerWisere)
        return next(
          new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      if (companyId !== customerWisere.companyId) {
        return next(
          new CustomError(
            customerErrorDetails.E_3002(`You can not access to company ${customerWisere.companyId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await CustomerWisereModel.destroy({ where: { id: customerWisereId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/get-customers-wisere:
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
  public getCustomerWiseres = async (req: Request, res: Response, next: NextFunction) => {
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
        CustomerWisereModel,
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
   * /customer/get-customer-wisere/{customerWisereId}:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getCustomer
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getCustomerWisereById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = res.locals.staffPayload;
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(customerWisereId, customerWireseIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const customerWisere = await CustomerWisereModel.findOne({
        where: { id: customerWisereId, companyId: companyId }
      });
      if (!customerWisere)
        return next(
          new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customerWisere));
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
   *         description: Success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
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

  /**
   * @swagger
   * definitions:
   *   CustomerVerifyToken:
   *       required:
   *           - token
   *       properties:
   *           token:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/verify-token:
   *   post:
   *     tags:
   *       - Customer
   *     name: customer-verify-token
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerVerifyToken'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public verifyTokenCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.token) {
        return next(new CustomError(generalErrorDetails.E_0002()));
      }
      const accessTokenData = await verifyAccessToken(req.body.token);
      if (accessTokenData instanceof CustomError) {
        return next(new CustomError(generalErrorDetails.E_0003()));
      } else {
        const customer = await CustomerModel.scope('safe').findOne({
          where: { id: accessTokenData.userId }
        });
        if (!customer) {
          return next(new CustomError(generalErrorDetails.E_0003()));
        }
        return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
      }
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CustomerLoginSocial:
   *       required:
   *           - provider
   *           - providerId
   *           - fullName
   *           - token
   *       properties:
   *           provider:
   *               type: string
   *           providerId:
   *               type: string
   *           email:
   *               type: string
   *           fullName:
   *               type: string
   *           avatarPath:
   *               type: string
   *           token:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/login-social:
   *   post:
   *     tags:
   *       - Customer
   *     name: customer-login-social
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerLoginSocial'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public loginSocial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let customer: CustomerModel;
      let data: any;
      let accessTokenData: IAccessTokenData;
      let accessToken: string;
      let refreshTokenData: IRefreshTokenData;
      let refreshToken: string;
      let profile: CustomerModel;
      let newCustomer: CustomerModel;
      let socialInfor: any;
      const validateErrors = validate(req.body, loginSocialSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      if (req.body.email) {
        if (req.body.provider === ESocialType.GOOGLE) {
          socialInfor = await validateGoogleToken(req.body.token);
          if (socialInfor.response.email !== req.body.email || socialInfor.response.expires_in === 0) {
            return next(new CustomError(customerErrorDetails.E_3006('Incorrect google token'), HttpStatus.BAD_REQUEST));
          }
        } else if (req.body.provider === ESocialType.FACEBOOK) {
          socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
          if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
            return next(
              new CustomError(customerErrorDetails.E_3006('Incorrect facebook token'), HttpStatus.BAD_REQUEST)
            );
          }
        }
        customer = await CustomerModel.scope('safe').findOne({ raw: true, where: { email: req.body.email } });
      } else {
        if (req.body.provider === ESocialType.GOOGLE) {
          return next(new CustomError(customerErrorDetails.E_3007('Missing email'), HttpStatus.BAD_REQUEST));
        }
      }
      if (customer) {
        if (req.body.provider === ESocialType.FACEBOOK) {
          if (customer.facebookId === null) {
            data = {
              facebookId: req.body.providerId,
              avatarPath: req.body.avatarPath ? req.body.avatarPath : null
            };
            await CustomerModel.update(data, { where: { email: req.body.email } });
          } else {
            if (customer.facebookId !== req.body.providerId) {
              return next(new CustomError(customerErrorDetails.E_3005('providerId incorrect'), HttpStatus.BAD_REQUEST));
            }
          }
          accessTokenData = {
            userId: customer.id,
            userName: `${customer.firstName} ${customer.lastName}`,
            userType: 'customer'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: customer.id,
            userName: `${customer.firstName} ${customer.lastName}`,
            userType: 'customer',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await CustomerModel.scope('safe').findOne({
            where: { email: req.body.email }
          });
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        if (req.body.provider === ESocialType.GOOGLE) {
          if (customer.googleId === null) {
            data = {
              googleId: req.body.providerId,
              avatarPath: req.body.avatarPath ? req.body.avatarPath : null
            };
            await CustomerModel.update(data, { where: { email: req.body.email } });
          } else {
            if (customer.googleId !== req.body.providerId) {
              return next(new CustomError(customerErrorDetails.E_3005('providerId incorrect'), HttpStatus.BAD_REQUEST));
            }
          }
          accessTokenData = {
            userId: customer.id,
            userName: `${customer.firstName} ${customer.lastName}`,
            userType: 'customer'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: customer.id,
            userName: `${customer.firstName} ${customer.lastName}`,
            userType: 'customer',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await CustomerModel.scope('safe').findOne({
            where: { email: req.body.email }
          });
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
      }

      if (req.body.provider === ESocialType.FACEBOOK) {
        socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
        if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
          return next(new CustomError(customerErrorDetails.E_3006('Incorrect facebook token'), HttpStatus.BAD_REQUEST));
        }
        customer = await CustomerModel.scope('safe').findOne({ raw: true, where: { facebookId: req.body.providerId } });
        if (!customer) {
          const password = await generatePWD(8);
          data = {
            firstName: req.body.fullName.split(' ')[0],
            lastName: req.body.fullName.split(' ')[1] ? req.body.fullName.split(' ')[1] : null,
            email: req.body.email ? req.body.email : null,
            facebookId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : null
          };
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newCustomer = await CustomerModel.create(data);
          accessTokenData = {
            userId: newCustomer.id,
            userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
            userType: 'customer'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: newCustomer.id,
            userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
            userType: 'customer',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await CustomerModel.scope('safe').findOne({
            where: { facebookId: newCustomer.facebookId }
          });
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        accessTokenData = {
          userId: customer.id,
          userName: `${customer.firstName} ${customer.lastName}`,
          userType: 'customer'
        };
        accessToken = await createAccessToken(accessTokenData);
        refreshTokenData = {
          userId: customer.id,
          userName: `${customer.firstName} ${customer.lastName}`,
          userType: 'customer',
          accessToken
        };
        refreshToken = await createRefreshToken(refreshTokenData);
        profile = await CustomerModel.scope('safe').findOne({
          where: { facebookId: customer.facebookId }
        });
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
      if (req.body.provider === ESocialType.GOOGLE) {
        customer = await CustomerModel.scope('safe').findOne({ raw: true, where: { googleId: req.body.providerId } });
        if (!customer) {
          const password = await generatePWD(8);
          data = {
            firstName: req.body.fullName.split(' ')[0],
            lastName: req.body.fullName.split(' ')[1] ? req.body.fullName.split(' ')[1] : null,
            email: req.body.email,
            googleId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : null
          };
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newCustomer = await CustomerModel.create(data);
          accessTokenData = {
            userId: newCustomer.id,
            userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
            userType: 'customer'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: newCustomer.id,
            userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
            userType: 'customer',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await CustomerModel.scope('safe').findOne({
            where: { googleId: newCustomer.googleId }
          });
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        accessTokenData = {
          userId: customer.id,
          userName: `${customer.firstName} ${customer.lastName}`,
          userType: 'customer'
        };
        accessToken = await createAccessToken(accessTokenData);
        refreshTokenData = {
          userId: customer.id,
          userName: `${customer.firstName} ${customer.lastName}`,
          userType: 'customer',
          accessToken
        };
        refreshToken = await createRefreshToken(refreshTokenData);
        profile = await CustomerModel.scope('safe').findOne({
          where: { googleId: customer.googleId }
        });
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CustomerLoginApple:
   *       required:
   *           - appleCode
   *           - appleId
   *       properties:
   *           appleCode:
   *               type: string
   *           appleId:
   *               type: string
   *           email:
   *               type: string
   *           fullName:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/login-apple:
   *   post:
   *     tags:
   *       - Customer
   *     name: customer-login-apple
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerLoginApple'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public loginApple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let accessTokenData: IAccessTokenData;
      let accessToken: string;
      let refreshTokenData: IRefreshTokenData;
      let refreshToken: string;
      let profile: any;
      const clientSecret = await generateAppleToken();
      const response: any = await validateAppleCode(req.body.appleCode, clientSecret);
      if (response.response.error) {
        return next(
          new CustomError(customerErrorDetails.E_3006('Incorrect apple information'), HttpStatus.BAD_REQUEST)
        );
      }
      const appleInfor = jwt.decode(response.response.id_token);
      if (appleInfor.sub !== req.body.appleId && response.expires_in !== 0) {
        return next(new CustomError(customerErrorDetails.E_3006('Incorrect apple id'), HttpStatus.BAD_REQUEST));
      }
      const customer = await CustomerModel.findOne({
        where: {
          appleId: req.body.appleId
        }
      });

      if (!customer) {
        const password = await generatePWD(8);
        const data: any = {
          firstName: req.body.fullName.split(' ')[0] ? req.body.fullName.split(' ')[0] : 'unknown',
          lastName: req.body.fullName.split(' ')[1] ? req.body.fullName.split(' ')[1] : null,
          email: req.body.email ? req.body.email : null,
          appleId: req.body.appleId,
          isBusinessAccount: false
        };
        data.password = await hash(password, PASSWORD_SALT_ROUNDS);
        const newCustomer = await CustomerModel.create(data);
        accessTokenData = {
          userId: newCustomer.id,
          userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
          userType: 'customer'
        };
        accessToken = await createAccessToken(accessTokenData);
        refreshTokenData = {
          userId: newCustomer.id,
          userName: `${newCustomer.firstName} ${newCustomer.lastName}`,
          userType: 'customer',
          accessToken
        };
        refreshToken = await createRefreshToken(refreshTokenData);
        profile = await CustomerModel.scope('safe').findOne({
          where: { appleId: newCustomer.appleId }
        });
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
      accessTokenData = {
        userId: customer.id,
        userName: `${customer.firstName} ${customer.lastName}`,
        userType: 'customer'
      };
      accessToken = await createAccessToken(accessTokenData);
      refreshTokenData = {
        userId: customer.id,
        userName: `${customer.firstName} ${customer.lastName}`,
        userType: 'customer',
        accessToken
      };
      refreshToken = await createRefreshToken(refreshTokenData);
      profile = await CustomerModel.scope('safe').findOne({
        where: { appleId: customer.appleId }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   registerCustomer:
   *       properties:
   *           firstName:
   *               required: true
   *               type: string
   *           lastName:
   *               required: true
   *               type: string
   *           gender:
   *               type: integer
   *               enum: [0, 1, 2]
   *           phone:
   *               required: true
   *               type: string
   *           email:
   *               required: true
   *               type: string
   *           birthDate:
   *               type: string
   *           passportNumber:
   *               type: string
   *           address:
   *               type: string
   *           password:
   *               required: true
   *               type: string
   *
   *
   */

  /**
   * @swagger
   * /customer/register-customer-marketplace:
   *   post:
   *     tags:
   *       - Customer
   *     name: registerCustomer
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/registerCustomer'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public registerCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email ? req.body.email : null,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        password: req.body.password
      };
      const validateErrors = validate(data, registerCustomerSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const existPhone = await CustomerModel.findOne({ where: { phone: data.phone } });
      if (existPhone) return next(new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST));
      if (req.body.email) {
        const existEmail = await CustomerModel.findOne({ where: { email: data.email } });
        if (existEmail) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
      }
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      const customer = await CustomerModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
    } catch (error) {
      return next(error);
    }
  };
}
