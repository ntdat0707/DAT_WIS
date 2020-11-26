import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import {
  createQuotationsDentalSchema,
  treatmentIdSchema,
  updateQuotationsDentalSchema,
  quotationDentalIdSchema
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
import { Types } from 'mongoose';
import _ from 'lodash';

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
   */
  /**
   * @swagger
   * /treatment/quotations/create-quotations:
   *   post:
   *     tags:
   *       - Treatment
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
        const quotationDetailsData: any = await Promise.all(
          req.body.quotationsDetails.map(async (item: any) => {
            item.quantity = TEETH_2H in item.teethNumbers ? 1 : item.teethNumbers.length;
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
        const quotationsDetails: any = await QuotationsDentalDetailModel.insertMany(quotationDetailsData);
        let teethIds: any = [];
        let newProcedures: any = [];
        newProcedures = await Promise.all(
          quotationDetailsData.map(async (item: any) => {
            if (item.isAccept === true) {
              teethIds = await Promise.all(
                item.teethNumbers.map(async (i: any) =>
                  (await TeethModel.findOne({ toothNumber: parseInt(i, 10) }))._id.toString()
                )
              );
              const serviceId = item.serviceId;
              const serviceData = await ServiceModel.findOne({
                where: { id: serviceId },
                attributes: ['name', 'sale_price'],
                raw: true
              }).then((serviceName: any) => {
                return serviceName;
              });
              delete Object.assign(item, { ['teethId']: item.teethNumbers }).teethNumbers;
              item.serviceName = serviceData.name;
              item.price = serviceData.sale_price;
              item.teethId = teethIds;
              item.totalPrice = item.price * item.quantity;
              item.locationId = req.body.locationId;
              item.customerId = req.body.customerId;
              item.treatmentId = req.body.treatmentId;
              item = _.omit(item, ['isAccept', 'quotationsDentalId', 'currencyUnit', 'tax', 'teethType']);
              return item;
            }
          })
        );
        let totalPrice: number = 0;
        await Promise.resolve(
          QuotationsDentalDetailModel.find({ quotationsDentalId: quotationsId }, (err: any, result: any) => {
            if (err) { throw err; }
            totalPrice = parseInt(
              result.map((item: any) => +item.price),
              10
            );
          }) as any
        );
        const QuotationDentalIds = quotationsDetails.map((item: any) => item._id);
        await QuotationsDentalModel.updateOne(
          { _id: quotationsId },
          {
            quotationsDentalDetails: QuotationDentalIds,
            totalPrice: totalPrice
          }
        ).exec();
        await ProcedureModel.insertMany(newProcedures);
        const quotationsDentalResult = await QuotationsDentalModel.findById(quotationsId)
          .populate('QuotationsDentalDetail').exec();
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotationsDentalResult));
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
   *       - Treatment
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
   *                            enum: [usd, vnd]
   */
  /**
   * @swagger
   * /treatment/quotations/update-quotations-dental/{quotationsId}:
   *   put:
   *     tags:
   *       - Treatment
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
      const quotationsId = req.params.quotationsId;
      const validateQuotationsIdErrors = validate(quotationsId, quotationDentalIdSchema);
      if (validateQuotationsIdErrors) {
        throw new CustomError(validateQuotationsIdErrors, httpStatus.BAD_REQUEST);
      }
      const quotationsData = {
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
      const quotationsDental: any = await QuotationsDentalModel.findById(quotationsId).exec();
      if (!quotationsDental) {
        throw new CustomError(
          treatmentErrorDetails.E_3903(`quotations dental ${quotationsId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      console.log('quotationsId', quotationsId);
      console.log(await QuotationsDentalModel.findById(quotationsId));
      await QuotationsDentalModel.updateOne(
        {
          _id: quotationsId
        },
        {
          date: quotationsData.date,
          expire: quotationsData.expire,
          locationId: quotationsData.locationId,
          note: quotationsData.note
        }
      ).exec();
      console.log('done');
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
      const newProcedures: any =  [];
      for (const quotationsDentalDetail of quotationsData.quotationsDetails) {
        let flagNewProcedure = false;
        if (quotationsDentalDetail._id) {
          const qdDetail = await QuotationsDentalDetailModel.findById(quotationsDentalDetail._id).exec();
          if (!qdDetail) {
            throw new CustomError(
              treatmentErrorDetails.E_3904(`quotations dental detail ${quotationsId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          await QuotationsDentalDetailModel.update(
            { _id: quotationsDentalDetail.quotationsId },
            quotationsDentalDetail
          ).exec();
          flagNewProcedure = !qdDetail.isAccept && quotationsDentalDetail.isAccept;
        } else {
          console.log('abc');
          const quotationsDentalDetails = new QuotationsDentalDetailModel({
            ...quotationsDentalDetail,
            quotationsDentalId: quotationsDental._id
          });
          console.log('bca');
          await quotationsDentalDetails.save();
          quotationsDental.quotationsDentalDetails.push(quotationsDentalDetails._id);
          flagNewProcedure = quotationsDentalDetail.isAccept;
        }

        if (flagNewProcedure) {
          const teethIds = await Promise.all(
            quotationsDentalDetail.teethNumbers.map(async (i: any) => {
              const teethId = await TeethModel.findOne({ toothNumber: parseInt(i, 10) }).then((teeth: any) => {
                return teeth._id;
              });
              return teethId.toString();
            })
          );
          const serviceId = quotationsDentalDetail.serviceId;
          const serviceData = await ServiceModel.findOne({
            where: { id: serviceId },
            attributes: ['name', 'sale_price'],
            raw: true
          }).then((serviceName: any) => {
            return serviceName;
          });
          const newProcedure = {
            ...JSON.parse(JSON.stringify(quotationsDentalDetail)),
            serviceName: serviceData.name,
            price: serviceData.sale_price,
            teethId: teethIds,
            totalPrice: quotationsDentalDetail.price * quotationsDentalDetail.quantity,
            locationId: quotationsData.locationId,
            customerId: quotationsDental.customerId,
            treatmentId: quotationsDental.treatmentId
          };
          newProcedures.push(_.omit(newProcedure, ['isAccept', 'quotationsDentalId', 'currencyUnit', 'tax', 'teethType']));
        }
      }
      console.log(JSON.stringify(newProcedures, null, 2));
      await ProcedureModel.insertMany([newProcedures]);
      let totalPrice: number = 0;
      await Promise.resolve(
        QuotationsDentalDetailModel.find({ quotationsDentalId: quotationsDental._id }, (err: any, result: any) => {
          if (err) { throw err; }
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
      console.log(error);
      return next(error);
    }
  };
}
