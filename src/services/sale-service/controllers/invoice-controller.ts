import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createInvoiceSchema } from '../configs/validate-schemas/invoice';
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
}
