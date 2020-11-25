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
import {
  QuotationsDentalModel,
  QuotationsDentalDetailModel,
  ProcedureModel,
  TeethModel
} from '../../../repositories/mongo/models';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { TEETH_2H } from '../configs/consts';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { ServiceModel } from '../../../repositories/postgres/models/service';
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
   *                            enum: [vnd, usd]
   *                        tax:
   *                            type: string
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
        let quotationDetailsData: any = [];
        let data: any = [];
        data = await Promise.all(
          req.body.quotationsDetails.map(async (item: any) => {
            if ('2H' in item.teethNumbers) {
              item.quantity = 1;
            } else item.quantity = item.teethNumbers.length;
            Object.assign(item, { quotationsDentalId: quotationsId.toString() });
            const serviceId = item.serviceId;
            const servicePrice = await ServiceModel.findOne({
              where: { id: serviceId },
              attributes: ['sale_price'],
              raw: true
            }).then((salePrice: any) => {
              return salePrice.sale_price;
            });
            item.price = servicePrice * item.quantity;
            return item;
          })
        );
        quotationDetailsData = data;
        const quotationsDetails = await QuotationsDentalDetailModel.insertMany(quotationDetailsData);
        let teethIds: any = [];
        let newProcedures: any = [];
        newProcedures = await Promise.all(
          quotationDetailsData.map(async (item: any) => {
            if (item.isAccept === true) {
              teethIds = await Promise.all(
                item.teethNumbers.map(async (i: any) => {
                  const teethId = await TeethModel.findOne({ toothNumber: parseInt(i, 10) }).then((teeth: any) => {
                    return teeth._id;
                  });
                  return teethId.toString();
                })
              );
              const serviceId = item.serviceId;
              const serviceData = await ServiceModel.findOne({
                where: { id: serviceId },
                attributes: ['name', 'sale_price'],
                raw: true
              }).then((serviceName: any) => {
                return serviceName;
              });
              item.serviceName = serviceData.name;
              item.price = serviceData.sale_price;
              delete Object.assign(item, { ['teethId']: item.teethNumbers }).teethNumbers;
              item.teethId = teethIds;
              item.totalPrice = item.price * item.quantity;
              item.locationId = req.body.locationId;
              item.customerId = req.body.customerId;
              item.treatmentId = req.body.treatmentId;
              delete item.isAccept;
              delete item.quotationsDentalId;
              delete item.currencyUnit;
              delete item.tax;
              delete item.teethType;
              return item;
            }
          })
        );
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
        await QuotationsDentalModel.updateOne({ _id: quotationsId }, { totalPrice: totalPrice }).exec();
        await ProcedureModel.insertMany(newProcedures);
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
   *   get:
   *     tags:
   *       - Quotations
   *     security:
   *       - Bearer: []
   *     name: getQuotationsDental
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
   *           date:
   *               type: string
   *               format: date
   *           expire:
   *               type: string
   *               format: date
   *           note:
   *               type: string
   *           locationId:
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
   *                            enum: [vnd, usd]
   *                        tax:
   *                            type: string
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
        date: req.body.date,
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
          treatmentErrorDetails.E_3903(`quotations dental ${quotationsData.quotationsId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await QuotationsDentalModel.updateOne(
        {
          _id: quotationsData.quotationsId
        },
        {
          ...quotationsDental,
          date: quotationsData.date,
          expire: quotationsData.expire,
          locationId: quotationsData.locationId,
          note: quotationsData.note
        }
      ).exec();
      quotationsData.quotationsDetails = await Promise.all(
        quotationsData.quotationsDetails.map(async (item: any) => {
          item.quantity = TEETH_2H in item.teethNumbers ? 1 : item.teethNumbers.length;
          const serviceId = item.serviceId;
          const servicePrice = await ServiceModel.findOne({
            where: { id: serviceId },
            attributes: ['sale_price'],
            raw: true
          }).then((salePrice: any) => {
            return salePrice.sale_price;
          });
          item.price = servicePrice * item.quantity;
          return item;
        })
      );
      for (const quotationsDentalDetail of quotationsData.quotationsDetails) {
        let flagNewProcedure = false;
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
          flagNewProcedure = !qdDetail.isAccept && quotationsDentalDetail.isAccept;
        } else {
          const quotationsDentalDetails = new QuotationsDentalDetailModel({
            ...quotationsDentalDetail,
            quotationsDental: quotationsDental
          });
          await quotationsDentalDetails.save();
          quotationsDental.quotationsDentalDetails.push(quotationsDentalDetails._id.toString());
          flagNewProcedure = quotationsDentalDetail.isAccept;
        }
        if (flagNewProcedure) {
          let newProcedure = JSON.parse(JSON.stringify(quotationsDentalDetail));
          const teethIds = await Promise.all(
            newProcedure.teethNumbers.map(async (i: any) => {
              const teethId = await TeethModel.findOne({ toothNumber: parseInt(i, 10) }).then((teeth: any) => {
                return teeth._id;
              });
              return teethId.toString();
            })
          );
          const serviceId = newProcedure.serviceId;
          const serviceData = await ServiceModel.findOne({
            where: { id: serviceId },
            attributes: ['name', 'sale_price'],
            raw: true
          }).then((serviceName: any) => {
            return serviceName;
          });
          delete Object.assign(newProcedure, { ['teethId']: newProcedure.teethNumbers }).teethNumbers;
          newProcedure.serviceName = serviceData.name;
          newProcedure.price = serviceData.sale_price;
          newProcedure.teethId = teethIds;
          newProcedure.totalPrice = newProcedure.price * newProcedure.quantity;
          newProcedure.locationId = req.body.locationId;
          newProcedure.customerId = req.body.customerId;
          newProcedure.treatmentId = req.body.treatmentId;
          const { isAccept, quotationsDentalId, currencyUnit, tax, teethType, ...data } = newProcedure;
          newProcedure = data;
          await ProcedureModel.insertMany([newProcedure]);
        }
      }
      let totalPrice: number = 0;
      await Promise.resolve(
        QuotationsDentalDetailModel.find({ quotationsDentalId: quotationsDental._id.toString() }, (err: any, result: any) => {
          if (err) throw err;
          totalPrice = parseInt(
            result.map((item: any) => +item.price),
            10
          );
        }) as any
      );
      quotationsDental.totalPrice = totalPrice;
      await quotationsDental.save();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
