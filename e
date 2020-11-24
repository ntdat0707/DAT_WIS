import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { createQuotationsDentalSchema, updateQuotationsDentalSchema, quotationsDentalDetailSchema } from '../configs/validate-schemas';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { QuotationsDentalModel, QuotationsDentalDetailModel } from '../../../repositories/mongo/models';

export class QuotationsController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   quotationCreate:
   *       properties:
   *           Date:
   *               type: string
   *               format: date
   *           Expire:
   *               type: string
   *               format: date
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           accountedBy:
   *               type: string
   *               enum: [percent, money]
   *           quotationsDetails:
   *               type: array
   *               items:
   *                    type: object
   *                    properties:
   *                        isAccept:
   *                            type: boolean
   *                        serviceId:
   *                            type: string
   *                        staffId:
   *                            type: string
   *                        teeth:
   *                            type: array
   *                            items:
   *                                type: string
   *                        discount:
   *                            type: number
   *                        discountType:
   *                            type: string
   *                            enum: [percent, money]
   *                        currencyUnit:
   *                            type: string
   *                            enum: [usd, vnd]
   *                        tax:
   *                            type: string
   *                        price:
   *                            type: number
   */
  /**
   * @swagger
   * /treatment/create-quotations:
   *   post:
   *     tags:
   *       - Quotations
   *     security:
   *       - Bearer: []
   *     name: createQuotations
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/quotationCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createQuotationsDental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const quotationData = {
        date: req.body.Date,
        expire: req.body.Expire,
        treatmentId: req.body.treatmentId,
        note: req.body.note,
        locationId: req.body.locationId,
        customerId: req.body.customerId,
        accountedBy: !req.body.accountedBy ? res.locals.staffPayload.id : req.body.accountedBy
      };
      const createQuotation = new QuotationsDentalModel(quotationData);
      const quotationId = createQuotation.save((err: any, quotation: any) => {
        return quotation._id;
      });
      const quotationDetail = [];
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   quotationUpdate:
   *       properties:
   *           Date:
   *               type: string
   *               format: date
   *           Expire:
   *               type: string
   *               format: date
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           accountedBy:
   *               type: string
   *           quotationsDetails:
   *               type: array
   *               items:
   *                    type: object
   *                    properties:
   *                        isAccept:
   *                            type: boolean
   *                        serviceId:
   *                            type: string
   *                        staffId:
   *                            type: string
   *                        teeth:
   *                            type: array
   *                            items:
   *                                type: string
   *                        discount:
   *                            type: number
   *                        discountType:
   *                            type: string
   *                            enum: [percent, money]
   *                        currencyUnit:
   *                            type: string
   *                            enum: [usd, vnd]
   *                        tax:
   *                            type: number
   */
  /**
   * @swagger
   * /treatment/quotations/update-quotations-dental/{quotationsId}:
   *   put:
   *     tags:
   *       - Quotations
   *     security:
   *       - Bearer: []
   *     name: updateQuotationsDental
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/quotationCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateQuotationsDental = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const quotationsDental = {
         expire: req.body.expire,
         treatmentId: req.body.treatmentId,
         locationId: req.body.locationId,
         note: req.body.note,
         quotationsDentalDetails: req.body.quotationsDentalDetails
       };
      const validateErrors = validate(quotationsDental, updateQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }

    } catch (error) {
      return next(error);
    }
  };
}
