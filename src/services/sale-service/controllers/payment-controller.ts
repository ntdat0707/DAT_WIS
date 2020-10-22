import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { createPaymentSchema } from '../configs/validate-schemas';
import { InvoiceModel, PaymentModel, ReceiptModel, sequelize } from '../../../repositories/postgres/models';
import { invoiceErrorDetails } from '../../../utils/response-messages/error-details/';
import { EBalanceType } from './../../../utils/consts/index';
import { buildSuccessMessage } from '../../../utils/response-messages';
export class PaymentController {
  /**
   * @swagger
   * definitions:
   *   paymentCreate:
   *       properties:
   *           invoiceId:
   *               type: string
   *           type:
   *               type: string
   *           amount:
   *               type: integer
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
      const data = {
        invoiceId: req.body.invoiceId,
        type: req.body.type,
        amount: req.body.amount
      };
      const validateErrors = validate(data, createPaymentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      let invoice = await InvoiceModel.findOne({ where: { id: data.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${data.invoiceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      if (data.amount > invoice.balance) {
        throw new CustomError(
          invoiceErrorDetails.E_3305(
            `amount ${data.amount} is greater than the balance ${invoice.balance} in the invoice`
          ),
          httpStatus.BAD_REQUEST
        );
      }
      transaction = await sequelize.transaction();
      const payment = await PaymentModel.create(data, { transaction });
      const balance = invoice.balance - payment.amount;
      let status: string;
      if (balance === 0) {
        status = EBalanceType.PAID;
      } else if (balance > 0 && balance < invoice.subTotal) {
        status = EBalanceType.PART_PAID;
      }
      invoice = await invoice.update({ balance: balance, status: status }, { transaction });
      let receiptCode = '';
      for (let i = 0; i < 10; i++) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        receiptCode = 'REC' + randomCode;
        const existReceiptCode = await ReceiptModel.findOne({ where: { code: receiptCode } });
        if (!existReceiptCode) {
          break;
        }
      }
      const dataReceipt = {
        code: receiptCode,
        customerId: invoice.customerWisereId,
        staffId: res.locals.staffPayload.id,
        amount: payment.amount,
        paymentId: payment.id,
        // type: payment.type,
        locationId: invoice.locationId
      };
      await ReceiptModel.create(dataReceipt, { transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(payment));
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };
}
