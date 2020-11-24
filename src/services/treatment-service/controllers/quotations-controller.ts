import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { createQuotationsDentalSchema, treatmentIdSchema } from '../configs/validate-schemas';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { QuotationsDentalModel, QuotationsDentalDetailModel } from '../../../repositories/mongo/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { TEETH_ADULT, TEETH_CHILD } from '../configs/consts/index';
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
      if (req.body.quotationsDetails) {
        const createQuotation = new QuotationsDentalModel(quotationData);
        const quotationsId = createQuotation._id;
        createQuotation.save();
        const quotationDetailsData: any = [];
        req.body.quotationsDetails.map((item: any) => {
          if (item.teeth.includes('2H')) {
            if (item.teetType === 'adult') item.quantity = TEETH_ADULT.length;
            else item.quantity = TEETH_CHILD.length;
          } else item.quantity = item.teeth.length;
          Object.assign(item, { quotationsDentalId: quotationsId });
          quotationDetailsData.push(item);
        });
        const quotationsDetails = await QuotationsDentalDetailModel.insertMany(quotationData);
        let totalPrice: any;
        await Promise.resolve(
          QuotationsDentalDetailModel.find({ _id: quotationsId }, (err: any, result: any) => {
            if (err) throw err;
            return (totalPrice += result.price);
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
   * /treatment/get-quotations/{treatmentId}:
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
   *
   *           customerId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['planning', 'confirmed', 'completed']
   */
  /**
   * @swagger
   * /treatment/quotations/update-quotations-dental:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createTreatment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/quotationUpdate'
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
      const validateErrors = validate(req.body, createQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
    } catch (error) {
      return next(error);
    }
  };
}
