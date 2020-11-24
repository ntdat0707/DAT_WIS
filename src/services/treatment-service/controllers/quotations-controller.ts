import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import {
  createQuotationsDentalSchema,
  updateQuotationsDentalSchema
} from '../configs/validate-schemas';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { QuotationsDentalModel, QuotationsDentalDetailModel } from '../../../repositories/mongo/models';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { TEETH_ADULT, TEETH_CHILD, TEETH_2H } from '../configs/consts';
import { ETeeth } from '../../../utils/consts';

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
   *     - in: path
   *       name: quotationsId
   *       type: string
   *       required: true
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
      const quotationsData = {
        quotationsId: req.params.quotationsId,
        expire: req.body.expire,
        locationId: req.body.locationId,
        note: req.body.note,
        quotationsDetails: req.body.quotationsDetails
      };
      const validateErrors = validate(quotationsData, updateQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const quotationsDental: any = await QuotationsDentalModel.findById(quotationsData.quotationsId).exec();
      if (!quotationsDental) {
        throw new CustomError(
          treatmentErrorDetails.E_3905(`quotations dental ${quotationsData.quotationsId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await QuotationsDentalModel.update(
        {
          _id: quotationsData.quotationsId
        },
        {
          ...quotationsDental,
          expire: quotationsData.expire,
          locationId: quotationsData.locationId,
          note: quotationsData.note
        }
      ).exec();
      quotationsData.quotationsDetails = quotationsData.quotationsDetails.map((item: any) => {
        if (item.teeth.includes(TEETH_2H)) {
          if (item.teethType === ETeeth.ADULT) {
            item.quantity = TEETH_ADULT.length;
          } else {
            item.quantity = TEETH_CHILD.length;
          }
        } else {
          item.quantity = item.teeth.length;
        }
        return item;
      });
      for (const quotationsDentalDetail of quotationsData.quotationsDetails) {
        if (quotationsDentalDetail.quotationsId) {
          const qdDetail = await QuotationsDentalDetailModel.findById(quotationsDentalDetail.quotationsId).exec();
          if (!qdDetail) {
            throw new CustomError(
              treatmentErrorDetails.E_3906(`quotations dental detail ${quotationsData.quotationsId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          await QuotationsDentalDetailModel.update(
            { _id: quotationsDentalDetail.quotationsId },
            quotationsDentalDetail
          ).exec();
        } else {
          const quotationsDentalDetails = new QuotationsDentalDetailModel({
            ...quotationsDentalDetail,
            quotationsDental: quotationsDental
          });
          await quotationsDentalDetails.save();
          quotationsDental.quotationsDentalDetails.push(quotationsDentalDetails);
        }
      }
      await quotationsDental.save();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
