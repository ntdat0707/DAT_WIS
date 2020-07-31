//
//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
// import { FindOptions } from 'sequelize';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { customerErrorDetails } from '../../../utils/response-messages/error-details';
// import { buildSuccessMessage } from '../../../utils/response-messages';
import { CustomerModel } from '../../../repositories/postgres/models';

import { createCustomerSchema } from '../configs/validate-schemas';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { customerIdSchema } from '../configs/validate-schemas/customer';

export class CustomerController {
  /**
   * @swagger
   * definitions:
   *   customerCreate:
   *       properties:
   *           fullName:
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
        fullName: req.body.fullName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address
      };
      const validateErrors = validate(data, createCustomerSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      data.companyId = res.locals.staffPayload.companyId;
      const customer = await CustomerModel.findOne({ where: { email: data.email } });
      if (customer) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
      await CustomerModel.create(data);
      return res.status(HttpStatus.OK).send();
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
}
