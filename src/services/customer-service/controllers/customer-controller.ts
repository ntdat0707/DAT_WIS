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
  ContactModel,
  LocationModel,
  CompanyDetailModel
} from '../../../repositories/postgres/models';
import {
  createCustomerWisereSchema,
  customerWisereIdSchema,
  updateCustomerWisereSchema,
  loginSchema,
  loginSocialSchema,
  registerCustomerSchema
} from '../configs/validate-schemas';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { paginate } from '../../../utils/paginator';
import { FindOptions, Transaction, Op, Sequelize, QueryTypes } from 'sequelize';
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
import _ from 'lodash';
import {
  emailSchema,
  changePasswordSchema,
  changeProfileCustomerSchema,
  changePasswordCustomerSchema
} from '../configs/validate-schemas/customer';
import { v4 as uuidv4 } from 'uuid';
import { redis, EKeys } from '../../../repositories/redis';
import { ICustomerRecoveryPasswordTemplate } from '../../../utils/emailer/templates/customer-recovery-password';
import * as ejs from 'ejs';
import * as path from 'path';
import { sendEmail } from '../../../utils/emailer';
import { MqttUserModel } from '../../../repositories/mongo/models/mqtt-user-model';
import { Unaccent } from '../../../utils/unaccent';
const recoveryPasswordUrlExpiresIn = process.env.RECOVERY_PASSWORD_URL_EXPIRES_IN;
const frontEndUrl = process.env.MARKETPLACE_URL;
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
   *       name: color
   *       type: string
   *       required: true
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
   *     - in: "formData"
   *       name: code
   *       type: string
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
        color: req.body.color,
        moreEmailContact: req.body.moreEmailContact,
        morePhoneContact: req.body.morePhoneContact,
        // prefixCode: req.body.prefixCode,
        code: req.body.code
      };
      const validateErrors = validate(data, createCustomerWisereSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      data.companyId = res.locals.staffPayload.companyId;
      const existPhone = await CustomerWisereModel.findOne({ where: { phone: data.phone, companyId: data.companyId } });
      if (existPhone) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
      if (data.email) {
        const existEmail = await CustomerWisereModel.findOne({
          where: { email: data.email, companyId: data.companyId }
        });
        if (existEmail) throw new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST);
      }
      if (data.ownerId) {
        const existStaff = await StaffModel.scope('safe').findOne({
          where: { id: data.ownerId },
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              through: {
                attributes: []
              },
              where: { id: res.locals.staffPayload.workingLocationIds }
            }
          ]
        });
        if (!existStaff)
          throw new CustomError(staffErrorDetails.E_4000(`staffId ${data.ownerId} not found`), HttpStatus.NOT_FOUND);
      }
      if (req.file) {
        data.avatarPath = (req.file as any).location;
      }
      //check prefixCode
      // if (data.prefixCode) {
      //   const prefixCodeLocation = await LocationModel.findOne({
      //     where: {
      //       prefixCode: data.prefixCode,
      //       companyId: data.companyId
      //     }
      //   });
      //   if (!prefixCodeLocation) {
      //     throw new CustomError(
      //       locationErrorDetails.E_1012(
      //         `Prefix code ${data.prefixCode} is not existed on this company ${data.companyId}`
      //       ),
      //       HttpStatus.BAD_REQUEST
      //     );
      //   }
      // }
      //check customer code
      if (data.code) {
        const customerCode = await CustomerWisereModel.findOne({
          where: { code: data.code }
        });
        if (customerCode) {
          throw new CustomError(
            customerErrorDetails.E_3012(`Customer code ${customerCode.code} is already exists`),
            HttpStatus.NOT_FOUND
          );
        }
      } else {
        //count customer-wisere in company
        const resultQuery: any = await sequelize.query(
          'SELECT COUNT(id) FROM customer_wisere WHERE company_id =$companyId',
          {
            bind: { companyId: data.companyId },
            type: QueryTypes.SELECT
          }
        );
        const total = parseInt(resultQuery[0].count, 10) + 1;
        //check LengthCode company
        const company: any = await CompanyDetailModel.findOne({
          where: { companyId: data.companyId }
        });
        if (!company) {
          data.code = 0;
        } else {
          if (company.lengthCode === 0) {
            throw new CustomError(
              customerErrorDetails.E_3013(`Length code ${company.lengthCode} is smaller than total customer-wisere`),
              HttpStatus.BAD_REQUEST
            );
          } else {
            data.code = total.toString().padStart(company.lengthCode, '0'); //
          }
        }
      }
      transaction = await sequelize.transaction();
      const customerWisere = await CustomerWisereModel.create(data, { transaction });
      if (data.moreEmailContact && data.moreEmailContact.length > 0) {
        const arrInsertEmailContact = [];
        for (let i = 0; i < data.moreEmailContact.length; i++) {
          const existEmailCustomer = await CustomerWisereModel.findOne({
            where: { email: data.moreEmailContact[i].email, companyId: data.companyId }
          });
          if (existEmailCustomer) throw new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST);
          const existEmailContact = await ContactModel.findOne({
            where: { email: data.moreEmailContact[i].email }
          });
          if (existEmailContact) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
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
          if (existPhoneCustomer) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
          const existPhoneContact = await ContactModel.findOne({
            where: { phone: data.morePhoneContact[i].phone }
          });
          if (existPhoneContact) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
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
   * /customer/update-customer-wisere/{customerWisereId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updateCustomerWisere
   *     consumes:
   *      - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       required: true
   *       schema:
   *          type: string
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: firstName
   *       type: string
   *     - in: "formData"
   *       name: lastName
   *       type: string
   *     - in: "formData"
   *       name: phone
   *       type: string
   *     - in: "formData"
   *       name: email
   *       type: string
   *     - in: "formData"
   *       name: gender
   *       type: integer
   *       enum: [0, 1, 2]
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
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: color
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
  public updateCustomerWisere = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const { companyId, workingLocationIds } = res.locals.staffPayload;
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone && req.body.phone === 'null' ? null : req.body.phone,
        email: req.body.email,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        ownerId: req.body.ownerId,
        source: req.body.source,
        note: req.body.note,
        job: req.body.job,
        label: req.body.label,
        color: req.body.color,
        moreEmailContact: req.body.moreEmailContact,
        morePhoneContact: req.body.morePhoneContact
        // prefixCode: req.body.prefixCode
      };
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate({ ...data, customerWisereId: customerWisereId }, updateCustomerWisereSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const customerWisere = await CustomerWisereModel.findOne({
        where: { id: customerWisereId, companyId: companyId }
      });
      if (!customerWisere)
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          HttpStatus.NOT_FOUND
        );
      if (data.phone) {
        const existPhone = await CustomerWisereModel.findOne({
          where: { phone: data.phone, companyId: companyId, id: { [Op.ne]: customerWisereId } }
        });
        if (existPhone) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
      }
      if (data.email) {
        const existEmail = await CustomerWisereModel.findOne({
          where: { email: data.email, companyId: companyId, id: { [Op.ne]: customerWisereId } }
        });
        if (existEmail) throw new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST);
      }
      if (data.ownerId) {
        const existStaff = await StaffModel.scope('safe').findOne({
          where: { id: data.ownerId },
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              through: {
                attributes: []
              },
              where: { id: workingLocationIds }
            }
          ]
        });
        if (!existStaff)
          throw new CustomError(staffErrorDetails.E_4000(`staffId ${data.ownerId} not found`), HttpStatus.NOT_FOUND);
      }
      if (req.file) {
        data.avatarPath = (req.file as any).location;
      }
      //update code customer-wisere

      // if (data.code) {
      //   const customerCode = await CustomerWisereModel.findOne({
      //     where: { code: data.code, companyId: companyId }
      //   });
      //   if (customerCode) {
      //     throw new CustomError(
      //       customerErrorDetails.E_3012(`Customer code ${customerCode.code} is already exists`),
      //       HttpStatus.NOT_FOUND
      //     );
      //   }
      // }

      // if (data.prefixCode) {
      //   const prefixCodeLocation = await LocationModel.findOne({
      //     where: {
      //       prefixCode: data.prefixCode,
      //       companyId: companyId
      //     }
      //   });
      //   if (!prefixCodeLocation) {
      //     throw new CustomError(
      //       locationErrorDetails.E_1012(`Prefix code ${data.prefixCode} is not existed on this company ${companyId}`),
      //       HttpStatus.BAD_REQUEST
      //     );
      //   }
      // }
      transaction = await sequelize.transaction();
      await customerWisere.update(data, transaction);
      if (data.moreEmailContact && data.moreEmailContact.length > 0) {
        const curEmailContacts = await ContactModel.findAll({
          attributes: ['email', 'type'],
          where: { customerWisereId: customerWisereId, email: { [Op.not]: null } }
        });
        const emailContacts = curEmailContacts.map((curEmailContact) => ({
          email: curEmailContact.email,
          type: curEmailContact.type
        }));
        const removeEmails = _.differenceWith(emailContacts, data.moreEmailContact, _.isEqual);
        if (removeEmails.length > 0) {
          for (let i = 0; i < removeEmails.length; i++) {
            const contact = await ContactModel.findOne({
              where: {
                email: removeEmails[i].email,
                type: removeEmails[i].type,
                customerWisereId: customerWisereId
              }
            });
            await ContactModel.destroy({
              where: {
                id: contact.id
              },
              transaction
            });
          }
        }
        const addEmails = _.differenceWith(data.moreEmailContact, emailContacts, _.isEqual);
        const arrInsertEmailContact = [];
        if (addEmails.length > 0) {
          for (let i = 0; i < addEmails.length; i++) {
            const existEmailCustomer = await CustomerWisereModel.findOne({
              where: {
                email: addEmails[i].email,
                companyId: companyId,
                id: { [Op.not]: customerWisereId }
              }
            });
            if (existEmailCustomer) throw new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST);
            const existEmailContact = await ContactModel.findOne({
              where: { email: addEmails[i].email, customerWisereId: { [Op.not]: customerWisereId } }
            });
            if (existEmailContact) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
            arrInsertEmailContact.push({
              email: addEmails[i].email,
              type: addEmails[i].type,
              customerWisereId: customerWisere.id
            });
          }
          await ContactModel.bulkCreate(arrInsertEmailContact, { transaction });
        }
      }
      if (data.morePhoneContact && data.morePhoneContact.length > 0) {
        const curPhoneContacts = await ContactModel.findAll({
          attributes: ['phone', 'type'],
          where: { customerWisereId: customerWisereId, phone: { [Op.not]: null } }
        });
        const phoneContacts = curPhoneContacts.map((curPhoneContact) => ({
          phone: curPhoneContact.phone,
          type: curPhoneContact.type
        }));
        const removePhones = _.differenceWith(phoneContacts, data.morePhoneContact, _.isEqual);
        if (removePhones.length > 0) {
          for (let i = 0; i < removePhones.length; i++) {
            const contact = await ContactModel.findOne({
              where: {
                phone: removePhones[i].phone,
                type: removePhones[i].type,
                customerWisereId: customerWisereId
              }
            });
            await ContactModel.destroy({
              where: {
                id: contact.id
              },
              transaction
            });
          }
        }
        const addPhones = _.differenceWith(data.morePhoneContact, phoneContacts, _.isEqual);
        const arrInsertPhoneContact = [];
        if (addPhones.length > 0) {
          for (let i = 0; i < addPhones.length; i++) {
            const existPhoneCustomer = await CustomerWisereModel.findOne({
              where: {
                phone: addPhones[i].phone,
                companyId: companyId,
                id: { [Op.not]: customerWisereId }
              }
            });
            if (existPhoneCustomer) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
            const existPhoneContact = await ContactModel.findOne({
              where: { phone: addPhones[i].phone, id: { [Op.not]: customerWisereId } }
            });
            if (existPhoneContact) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
            arrInsertPhoneContact.push({
              phone: addPhones[i].phone,
              type: addPhones[i].type,
              customerWisereId: customerWisere.id
            });
          }
          await ContactModel.bulkCreate(arrInsertPhoneContact, { transaction });
        }
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
      const validateErrors = validate(customerWisereId, customerWisereIdSchema);
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const customerWisere = await CustomerWisereModel.findOne({ where: { id: customerWisereId } });
      if (!customerWisere)
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          HttpStatus.NOT_FOUND
        );
      if (companyId !== customerWisere.companyId) {
        throw new CustomError(
          customerErrorDetails.E_3002(`You can not access to company ${customerWisere.companyId}`),
          HttpStatus.FORBIDDEN
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
   *     - in: query
   *       name: searchValue
   *       required: false
   *       schema:
   *          type: string
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const query: FindOptions = {
        where: {
          companyId: companyId
        }
      };

      if (req.query.searchValue) {
        const unaccentSearchValue = Unaccent(req.query.searchValue);
        query.where = {
          ...query.where,
          ...{
            [Op.or]: [
              Sequelize.literal(
                `unaccent(concat("CustomerWisereModel"."last_name", ' ', "CustomerWisereModel"."first_name")) ilike '%${unaccentSearchValue}%'`
              ),
              Sequelize.literal(`"CustomerWisereModel"."code" ilike '%${req.query.searchValue}%'`),
              Sequelize.literal(`"CustomerWisereModel"."phone" like '%${req.query.searchValue}%'`),
              Sequelize.literal(`"CustomerWisereModel"."email" ilike '%${req.query.searchValue}%'`)
            ]
          }
        };
      }
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
      const validateErrors = validate(customerWisereId, customerWisereIdSchema);
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const customerWisere = await CustomerWisereModel.findOne({
        where: {
          id: customerWisereId,
          companyId: companyId
        },
        include: [
          {
            model: ContactModel,
            as: 'contacts',
            required: false
          },
          {
            model: StaffModel,
            as: 'owner',
            required: false
          }
        ]
      });
      if (!customerWisere)
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          HttpStatus.NOT_FOUND
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const customer = await CustomerModel.findOne({ raw: true, where: { email: data.email } });
      if (!customer)
        throw new CustomError(customerErrorDetails.E_3004('Email or password invalid'), HttpStatus.NOT_FOUND);
      const match = await compare(data.password, customer.password);
      if (!match) throw new CustomError(customerErrorDetails.E_3004('Email or password invalid'), HttpStatus.NOT_FOUND);
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
        throw new CustomError(generalErrorDetails.E_0002());
      }
      const accessTokenData = await verifyAccessToken(req.body.token);
      if (accessTokenData instanceof CustomError) {
        throw new CustomError(generalErrorDetails.E_0003());
      } else {
        const customer = await CustomerModel.findOne({
          where: { id: accessTokenData.userId }
        });
        if (!customer) {
          throw new CustomError(generalErrorDetails.E_0003());
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
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public loginSocial = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
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
      let mqttUserData: any;
      let mqttUserModel: any;
      const validateErrors = validate(req.body, loginSocialSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (req.body.email) {
        if (req.body.provider === ESocialType.GOOGLE) {
          socialInfor = await validateGoogleToken(req.body.token);
          if (socialInfor.response.email !== req.body.email || socialInfor.response.expires_in === 0) {
            throw new CustomError(customerErrorDetails.E_3006('Incorrect google token'), HttpStatus.BAD_REQUEST);
          }
        } else if (req.body.provider === ESocialType.FACEBOOK) {
          socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
          if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
            throw new CustomError(customerErrorDetails.E_3006('Incorrect facebook token'), HttpStatus.BAD_REQUEST);
          }
        }
        customer = await CustomerModel.findOne({ raw: true, where: { email: req.body.email } });
      } else {
        if (req.body.provider === ESocialType.GOOGLE) {
          throw new CustomError(customerErrorDetails.E_3007('Missing email'), HttpStatus.BAD_REQUEST);
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
              throw new CustomError(customerErrorDetails.E_3005('providerId incorrect'), HttpStatus.BAD_REQUEST);
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
              throw new CustomError(customerErrorDetails.E_3005('providerId incorrect'), HttpStatus.BAD_REQUEST);
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

      transaction = await sequelize.transaction();
      if (req.body.provider === ESocialType.FACEBOOK) {
        socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
        if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
          throw new CustomError(customerErrorDetails.E_3006('Incorrect facebook token'), HttpStatus.BAD_REQUEST);
        }
        customer = await CustomerModel.findOne({ raw: true, where: { facebookId: req.body.providerId } });
        if (!customer) {
          const password = await generatePWD(8);
          data = {
            lastName: req.body.fullName.split(' ')[0],
            firstName: req.body.fullName.split(' ').slice(1).join(' ')
              ? req.body.fullName.split(' ').slice(1).join(' ')
              : null,
            email: req.body.email ? req.body.email : '',
            facebookId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : ''
          };
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newCustomer = await CustomerModel.create(data, { transaction });
          mqttUserData = {
            isSupperUser: false,
            username: data.email
          };
          mqttUserData.password = data.password;
          mqttUserModel = new MqttUserModel(mqttUserData);
          await mqttUserModel.save();
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
            where: { facebookId: newCustomer.facebookId },
            transaction
          });
          //commit transaction
          await transaction.commit();
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
          where: { facebookId: customer.facebookId },
          transaction
        });
        //commit transaction
        await transaction.commit();
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
      if (req.body.provider === ESocialType.GOOGLE) {
        customer = await CustomerModel.findOne({ raw: true, where: { googleId: req.body.providerId } });
        if (!customer) {
          const password = await generatePWD(8);
          data = {
            lastName: req.body.fullName.split(' ')[0],
            firstName: req.body.fullName.split(' ').slice(1).join(' ')
              ? req.body.fullName.split(' ').slice(1).join(' ')
              : '',
            email: req.body.email || '',
            googleId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : null
          };
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newCustomer = await CustomerModel.create(data, { transaction });
          mqttUserData = {
            isSupperUser: false,
            username: data.email
          };
          mqttUserData.password = data.password;
          mqttUserModel = new MqttUserModel(mqttUserData);
          await mqttUserModel.save();
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
            where: { googleId: newCustomer.googleId },
            transaction
          });
          //commit transaction
          await transaction.commit();
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
          where: { googleId: customer.googleId },
          transaction
        });
        //commit transaction
        await transaction.commit();
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
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
    let transaction: Transaction;
    try {
      let accessTokenData: IAccessTokenData;
      let accessToken: string;
      let refreshTokenData: IRefreshTokenData;
      let refreshToken: string;
      let profile: any;
      const clientSecret = await generateAppleToken();
      const response: any = await validateAppleCode(req.body.appleCode, clientSecret);
      if (response.response.error) {
        throw new CustomError(customerErrorDetails.E_3006('Incorrect apple information'), HttpStatus.BAD_REQUEST);
      }
      const appleInfor = jwt.decode(response.response.id_token);
      if (appleInfor.sub !== req.body.appleId && response.expires_in !== 0) {
        throw new CustomError(customerErrorDetails.E_3006('Incorrect apple id'), HttpStatus.BAD_REQUEST);
      }
      const customer = await CustomerModel.findOne({
        where: {
          appleId: req.body.appleId
        }
      });

      transaction = await sequelize.transaction();
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
        const newCustomer = await CustomerModel.create(data, { transaction });
        const mqttUserData: any = {
          isSupperUser: false,
          username: data.email
        };
        mqttUserData.password = data.password;
        const mqttUserModel = new MqttUserModel(mqttUserData);
        await mqttUserModel.save();
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
        password: req.body.password
      };
      const validateErrors = validate(data, registerCustomerSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const existPhone = await CustomerModel.findOne({ where: { phone: data.phone } });
      if (existPhone) throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
      if (req.body.email) {
        const existEmail = await CustomerModel.findOne({ where: { email: data.email } });
        if (existEmail) throw new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST);
      }
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      // start transaction
      transaction = await sequelize.transaction();
      const customer = await CustomerModel.create(data, { transaction });
      const mqttUserData: any = {
        isSupperUser: false,
        username: data.email
      };
      mqttUserData.password = data.password;
      const mqttUserModel = new MqttUserModel(mqttUserData);
      await mqttUserModel.save();
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(customer));
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
   *   CustomerRequestNewPassword:
   *       required:
   *           - email
   *       properties:
   *           email:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/request-new-password:
   *   post:
   *     tags:
   *       - Customer
   *     name: customer-request-new-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerRequestNewPassword'
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const customer = await CustomerModel.findOne({ raw: true, where: { email: req.body.email } });
      if (!customer) throw new CustomError(customerErrorDetails.E_3001('Email not found'), HttpStatus.NOT_FOUND);
      const uuidToken = uuidv4();
      const dataSendMail: ICustomerRecoveryPasswordTemplate = {
        customerEmail: email,
        yourURL: `${frontEndUrl}/reset-password?token=${uuidToken}`
      };
      await redis.setData(`${EKeys.CUSTOMER_RECOVERY_PASSWORD_URL}-${uuidToken}`, JSON.stringify({ email: email }), {
        key: 'EX',
        value: recoveryPasswordUrlExpiresIn
      });
      const pathFile = path.join(process.cwd(), 'src/utils/emailer/templates/customer-recovery-password.ejs');
      ejs.renderFile(pathFile, dataSendMail, async (err: any, dataEjs: any) => {
        if (!err) {
          await sendEmail({
            receivers: email,
            subject: 'Change your account password',
            type: 'html',
            message: dataEjs
          });
        }
      });

      res.status(HttpStatus.OK).send(buildSuccessMessage({ msg: 'Please check your email' }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CustomerChangePassword:
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
   * /customer/change-password:
   *   put:
   *     tags:
   *       - Customer
   *     name: customer-change-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerChangePassword'
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const tokenStoraged = await redis.getData(`${EKeys.CUSTOMER_RECOVERY_PASSWORD_URL}-${body.token}`);
      if (!tokenStoraged) throw new CustomError(customerErrorDetails.E_3009('Invalid token'), HttpStatus.UNAUTHORIZED);
      const data = JSON.parse(tokenStoraged);
      const customer = await CustomerModel.findOne({ raw: true, where: { email: data.email } });
      if (!customer) throw new CustomError(staffErrorDetails.E_4000('Email not found'), HttpStatus.NOT_FOUND);
      const password = await hash(body.newPassword, PASSWORD_SALT_ROUNDS);
      await CustomerModel.update(
        { password: password },
        {
          where: {
            email: data.email
          }
        }
      );
      await redis.deleteData(`${EKeys.CUSTOMER_RECOVERY_PASSWORD_URL}-${body.token}`);
      res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/change-profile-customer:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: changeProfileCustomer
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
   *     - in: "formData"
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: currentPassword
   *       type: string
   *     - in: "formData"
   *       name: newPassword
   *       type: string
   *     - in: "formData"
   *       name: confirmPassword
   *       type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public changeProfileCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        gender: req.body.gender,
        birthDate: req.body.birthDate
      };
      let validateErrors = validate(data, changeProfileCustomerSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      if (data.phone) {
        const existPhone = await CustomerModel.findOne({
          where: {
            phone: data.phone,
            id: { [Op.not]: res.locals.customerPayload.id }
          }
        });
        if (existPhone) {
          throw new CustomError(customerErrorDetails.E_3003(), HttpStatus.BAD_REQUEST);
        }
      }

      if (req.file) {
        data.avatarPath = (req.file as any).location;
      }

      const existCustomer = await CustomerModel.findOne({
        where: {
          id: res.locals.customerPayload.id
        }
      });

      if (req.body.currentPassword || req.body.newPassword || req.body.confirmPassword) {
        const dataChangePassword = {
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword,
          confirmPassword: req.body.confirmPassword
        };
        validateErrors = validate(dataChangePassword, changePasswordCustomerSchema);
        if (validateErrors) {
          throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
        }

        const match = await compare(dataChangePassword.currentPassword, existCustomer.password);
        if (!match) {
          throw new CustomError(customerErrorDetails.E_3010(), HttpStatus.BAD_REQUEST);
        }

        if (dataChangePassword.newPassword !== dataChangePassword.confirmPassword) {
          throw new CustomError(customerErrorDetails.E_3011(), HttpStatus.BAD_REQUEST);
        }

        data.password = await hash(dataChangePassword.newPassword, PASSWORD_SALT_ROUNDS);
      }

      await existCustomer.update(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(existCustomer));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/me:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getCustomer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getProfileCustomer = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      const profile = await CustomerModel.findOne({
        where: {
          id: customerId
        }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(profile));
    } catch (error) {
      return next(error);
    }
  };
}
