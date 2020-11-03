import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import {
  createPaymentMethodSchema,
  createInvoicePaymentSchema,
  deletePaymentMethodSchema,
  updatePaymentMethodSchema
} from '../configs/validate-schemas';
import {
  InvoiceModel,
  PaymentMethodModel,
  InvoicePaymentModel,
  ProviderModel,
  ReceiptModel,
  sequelize
} from '../../../repositories/postgres/models';
import { invoiceErrorDetails } from '../../../utils/response-messages/error-details';
import { EBalanceType } from '../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages/responses';
import { paymentErrorDetails, paymentMethodErrorDetails } from '../../../utils/response-messages/error-details/sale';
export class InvoicePaymentController {
  /**
   * @swagger
   * definitions:
   *   PaymentMethods:
   *       properties:
   *           paymentMethodId:
   *               type: string
   *           amount:
   *               type: integer
   *           provider:
   *               type: object
   *               properties:
   *                   name:
   *                       type: string
   *                   accountNumber:
   *                       type: integer
   *
   */

  /**
   * @swagger
   * definitions:
   *   paymentCreate:
   *       properties:
   *           invoiceId:
   *               type: string
   *           paymentMethods:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/PaymentMethods'
   *
   */

  /**
   * @swagger
   * /sale/payment/create-invoice-payment:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createInvoicePayment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createInvoicePayment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, createInvoicePaymentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const invoice = await InvoiceModel.findOne({ where: { id: req.body.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${req.body.invoiceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
      const data = {
        invoiceId: req.body.invoiceId,
        customerWisereId: invoice.customerWisereId,
        staffId: res.locals.staffPayload.id,
        locationId: invoice.locationId,
        total: invoice.total,
        balance: invoice.balance,
        paymentMethods: req.body.paymentMethods
      };
      await this.createPaymentReceipt(data, transaction);
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  public async createPaymentReceipt(data: any, transaction: any) {
    try {
      const payments = [];
      const providers = [];
      const receipts = [];
      let balance = data.balance;
      let status: string;
      for (let i = 0; i < data.paymentMethods.length; i++) {
        let dataProvider: any;
        if (data.paymentMethods[i].provider) {
          dataProvider = {
            id: uuidv4(),
            name: data.paymentMethods[i].provider.name,
            accountNumber: data.paymentMethods[i].provider.accountNumber
          };
          providers.push(dataProvider);
        }
        const dataPayment = {
          id: uuidv4(),
          invoiceId: data.invoiceId,
          paymentMethodId: data.paymentMethods[i].paymentMethodId,
          amount: data.paymentMethods[i].amount,
          providerId: dataProvider ? dataProvider.id : null
        };
        payments.push(dataPayment);
        let receiptCode = '';
        for (let j = 0; j < 10; j++) {
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          receiptCode = 'REC' + randomCode;
          const existReceiptCode = await ReceiptModel.findOne({ where: { code: receiptCode } });
          if (!existReceiptCode) {
            break;
          }
        }
        const dataReceipt = {
          code: receiptCode,
          customerWisereId: data.customerWisereId,
          staffId: data.staffId,
          amount: data.paymentMethods[i].amount,
          paymentId: dataPayment.id,
          locationId: data.locationId
        };
        receipts.push(dataReceipt);
        balance -= dataPayment.amount;
        if (balance < 0) {
          balance = 0;
        }
      }
      if (balance === 0) {
        status = EBalanceType.PAID;
      } else if (balance > 0 && balance < data.total) {
        status = EBalanceType.PART_PAID;
      }
      if (providers.length > 0) {
        await ProviderModel.bulkCreate(providers, { transaction });
      }
      await InvoicePaymentModel.bulkCreate(payments, { transaction });
      await ReceiptModel.bulkCreate(receipts, { transaction });
      await InvoiceModel.update({ balance: balance, status: status }, { where: { id: data.invoiceId }, transaction });
      return balance;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @swagger
   * definitions:
   *   paymentMethodCreate:
   *       properties:
   *           paymentType:
   *               type: string
   *               enum: ['cash', 'card', 'wallet', 'other']
   *
   */

  /**
   * @swagger
   * /sale/payment/create-payment-method:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createPaymentMethod
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentMethodCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        companyId: res.locals.staffPayload.companyId,
        paymentType: req.body.paymentType
      };
      const validateErrors = validate(data, createPaymentMethodSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const paymentMethod = await PaymentMethodModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(paymentMethod));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/payment/get-list-payment-method:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getListPaymentMethod
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getListPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const paymentMethod = await PaymentMethodModel.findAll({
        where: { companyId: companyId }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(paymentMethod));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   paymentMethodUpdate:
   *       properties:
   *           paymentType:
   *               type: string
   *               enum: ['cash', 'card', 'wallet', 'other']
   *
   */

  /**
   * @swagger
   * /sale/payment/update-payment-method/{paymentMethodId}:
   *   put:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: updatePaymentMethod
   *     parameters:
   *     - in: path
   *       name : paymentMethodId
   *       required: true
   *       type: string
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentMethodUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updatePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        paymentMethodId: req.params.paymentMethodId,
        paymentType: req.body.paymentType
      };
      const validateErrors = validate(data, updatePaymentMethodSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const paymentMethod = await PaymentMethodModel.findOne({ where: { id: data.paymentMethodId } });
      if (!paymentMethod) {
        throw new CustomError(
          paymentMethodErrorDetails.E_3700(`Payment method with id ${data.paymentMethodId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await paymentMethod.update({ paymentType: data.paymentType });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/payment/delete-payment-method/{paymentMethodId}:
   *   delete:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: deletePaymentMethod
   *     parameters:
   *     - in: path
   *       name: paymentMethodId
   *       required: true
   *       type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public deletePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paymentMethodId = req.params.paymentMethodId;
      const validateErrors = validate(paymentMethodId, deletePaymentMethodSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const paymentMethod = await PaymentMethodModel.findOne({
        where: { id: paymentMethodId }
      });
      if (!paymentMethod) {
        return next(
          new CustomError(paymentErrorDetails.E_3601(`This payment method is not exist`), httpStatus.NOT_FOUND)
        );
      }
      await PaymentMethodModel.destroy({
        where: { id: paymentMethodId }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
