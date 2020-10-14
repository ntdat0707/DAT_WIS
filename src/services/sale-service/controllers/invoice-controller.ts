import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createInvoiceSchema, createPaymentSchema } from '../configs/validate-schemas/invoice';
import { InvoiceModel, sequelize } from '../../../repositories/postgres/models';
import { invoiceErrorDetails } from '../../../utils/response-messages/error-details/';
// import { CustomerModel } from '../../../repositories/postgres/models/customer-model';

export class InvoiceController {
  /**
   * @swagger
   * definitions:
   *   CreateInvoice:
   *       properties:
   *           code:
   *               type: string
   *               require: true
   *           locationId:
   *               type: string
   *               require: true
   *           appointmentId:
   *               type: string
   *           souce:
   *               type: string
   *           note:
   *               type: string
   *           discount:
   *               type: number
   *           tax:
   *               type: number
   *               require: true
   *           balance:
   *               type: number
   *           status:
   *               type: string
   *           subTotal:
   *               type: number
   *
   */

  /**
   * @swagger
   * /sale/invoice/create-invoice:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createInvoice
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateInvoice'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */

  public createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        ...req
      };
      const validateErrors = validate(data, createInvoiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage);
    } catch (error) {
      return next(error);
    }
  };

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
   * /sale/invoice/create-payment:
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
      const invoice = await InvoiceModel.findOne({ where: { id: data.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${data.invoiceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };
}
