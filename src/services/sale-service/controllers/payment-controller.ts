import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { createPaymentSchema } from '../configs/validate-schemas';
import {
  InvoiceModel,
  PaymentModel,
  ProviderModel,
  ReceiptModel,
  sequelize
} from '../../../repositories/postgres/models';
import { invoiceErrorDetails } from '../../../utils/response-messages/error-details/';
import { EBalanceType } from './../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
export class PaymentController {
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
   * /sale/payment/create-payment:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createPayment
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
  public createPayment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, createPaymentSchema);
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
        customerId: invoice.customerWisereId,
        staffId: res.locals.staffPayload.id,
        locationId: invoice.locationId,
        total: invoice.total,
        balance: invoice.balance,
        paymentMethods: req.body.paymentMethods
      };
      await this.createPaymentReceipt(data, transaction);
      await transaction.commit();
      return res.status(httpStatus.OK).send({});
    } catch (error) {
      //rollback transaction
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
        const dataPayment = {
          id: uuidv4(),
          invoiceId: data.invoiceId,
          paymentMethodId: data.paymentMethods[i].paymentMethodId,
          amount: data.paymentMethods[i].amount
        };
        payments.push(dataPayment);
        if (data.paymentMethods[i].provider) {
          const dataProvider = {
            paymentId: dataPayment.id,
            name: data.paymentMethods[i].provider.name,
            accountNumber: data.paymentMethods[i].provider.accountNumber
          };
          providers.push(dataProvider);
        }
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
          customerId: data.customerId,
          staffId: data.staffId,
          amount: data.paymentMethods[i].amount,
          paymentId: dataPayment.id,
          paymentMethodId: data.paymentMethods[i].paymentMethodId,
          locationId: data.locationId
        };
        receipts.push(dataReceipt);
        balance -= dataPayment.amount;
        if (balance < 0) {
          throw new CustomError(
            invoiceErrorDetails.E_3305(`amount is greater than the balance in the invoice`),
            httpStatus.BAD_REQUEST
          );
        }
      }
      if (balance === 0) {
        status = EBalanceType.PAID;
      } else if (balance > 0 && balance < data.total) {
        status = EBalanceType.PART_PAID;
      }
      await PaymentModel.bulkCreate(payments, { transaction });
      if (providers.length > 0) {
        await ProviderModel.bulkCreate(providers, { transaction });
      }
      await ReceiptModel.bulkCreate(receipts, { transaction });
      await InvoiceModel.update({ balance: balance, status: status }, { where: { id: data.invoiceId }, transaction });
      return balance;
    } catch (error) {
      throw error;
    }
  }
}
