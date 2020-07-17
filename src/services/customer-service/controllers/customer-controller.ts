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
import { CustomerModel } from '../../../repositories/postresql/models';

import { createCustomerSchema } from '../configs/validate-schemas';

export class CustomerController {
  constructor() {}

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
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public async createCustomer(req: Request, res: Response, next: NextFunction) {
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
      data.companyId = req.body.staffPayload.companyId;
      const customer = await CustomerModel.findOne({ where: { email: data.email } });
      if (customer) return next(new CustomError(customerErrorDetails.E_3000(), HttpStatus.BAD_REQUEST));
      await CustomerModel.create(data);
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  }
}
