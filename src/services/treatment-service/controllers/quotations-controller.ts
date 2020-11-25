import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import {
  createQuotationsDentalSchema,
  treatmentIdSchema,
  updateQuotationsDentalSchema
} from '../configs/validate-schemas';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { QuotationsDentalModel, QuotationsDentalDetailModel } from '../../../repositories/mongo/models';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { TEETH_ADULT, TEETH_CHILD, TEETH_2H } from '../configs/consts';
import { ETeeth } from '../../../utils/consts';
import { buildSuccessMessage } from '../../../utils/response-messages';

export class QuotationsController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   quotationCreate:
   *       properties:
   *           date:
   *               type: string
   *               format: date
   *           expire:
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
   *                        teethNumbers:
   *                            type: array
   *                            items:
   *                                type: string
   *                        teethType:
   *                            type: string
   *                            enum: [adult, child]
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
   * /treatment/quotations/create-quotations:
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
        date: req.body.date,
        expire: req.body.expire,
        treatmentId: req.body.treatmentId,
        note: req.body.note,
        locationId: req.body.locationId,
        customerId: req.body.customerId,
        accountedBy: !req.body.accountedBy ? res.locals.staffPayload.id : req.body.accountedBy
      };
      if (req.body.quotationsDetails) {
        const createQuotation = new QuotationsDentalModel(quotationData);
        const quotationsId = createQuotation._id;
        createQuotation.save();
        const quotationDetailsData: any = [];
        req.body.quotationsDetails.map((item: any) => {
          if (item.teeth.includes('2H')) {
            if (item.teethType === 'adult') item.quantity = TEETH_ADULT.length;
            else item.quantity = TEETH_CHILD.length;
          } else item.quantity = item.teeth.length;
          Object.assign(item, { quotationsDentalId: quotationsId });
          quotationDetailsData.push(item);
        });

        const quotationsDetails = await QuotationsDentalDetailModel.insertMany(quotationDetailsData);
        let totalPrice: number = 0;
        await Promise.resolve(
          QuotationsDentalDetailModel.find({ quotationsDentalId: quotationsId }, (err: any, result: any) => {
            if (err) throw err;
            totalPrice = parseInt(
              result.map((item: any) => +item.price),
              10
            );
          }) as any
        );
        await QuotationsDentalModel.update({ _id: quotationsId }, { totalPrice: totalPrice }).exec();
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotationsDetails));
      } else {
        const createQuotation = new QuotationsDentalModel(quotationData);
        const quotations = createQuotation.save();
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotations));
      }
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/quotations/get-quotations/{treatmentId}:
   *   post:
   *     tags:
   *       - Quotations
   *     security:
   *       - Bearer: []
   *     name: get-quotations
   *     parameters:
   *     - in: path
   *       name: treatmentId
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getQuotationsDental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentId = req.params.treatmentId;
      const validateErrors = validate(treatmentId, treatmentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const quotations = await QuotationsDentalModel.find({ treatmentId: treatmentId })
        .populate('QuotationsDentalDetail')
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(quotations));
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
              treatmentErrorDetails.E_3904(`quotations dental detail ${quotationsData.quotationsId} not found`),
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
