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
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { LocationModel } from '../../../repositories/postgres/models/location';
import { CustomerWisereModel } from '../../../repositories/postgres/models/customer-wisere-model';
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
        const createQuotation: any = new QuotationsDentalModel(quotationData);
        const quotationsId = createQuotation._id;
        let quotationDetailsData: any = [];
        let data: any = [];
        data = await Promise.all(
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
        quotationDetailsData = data;
        const quotationsDetails: any = await QuotationsDentalDetailModel.insertMany(quotationDetailsData);
        const quotationsDetailIds: any = quotationsDetails.map((item: any) => {
          return item._id;
        });
        createQuotation.quotationsDentalDetails.push(...quotationsDetailIds);
        createQuotation.save();
        let teethIds: any = [];
        let newProcedures: any = [];
        newProcedures = await Promise.all(
          quotationDetailsData.map(async (item: any) => {
            if (item.isAccept === true) {
              teethIds = await Promise.all(
                item.teethNumbers.map(async (i: any) =>
                  (await TeethModel.findOne({ toothNumber: parseInt(i, 10) }).exec())._id.toString()
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
            if (err) {
              throw err;
            }
            totalPrice = parseInt(
              result.map((item: any) => +item.price),
              10
            );
          }) as any
        );
        await QuotationsDentalModel.updateOne({ _id: quotationsId }, { totalPrice: totalPrice }).exec();
        if (newProcedures.length) {
          await ProcedureModel.insertMany(newProcedures);
        }
        const quotationDetailsResult = await QuotationsDentalModel.findById(quotationsId)
          .populate({
            path: 'quotationsDentalDetails',
            model: 'QuotationsDentalDetail'
          })
          .exec();
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotationDetailsResult));
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
      const quotations: any = await QuotationsDentalModel.findOne({ treatmentId: treatmentId })
        .populate({
          path: 'quotationsDentalDetails',
          model: 'QuotationsDentalDetail'
        })
        .exec();
      if (quotations.length !== 0) {
        const accountedBy: any = await StaffModel.findOne({
          where: { id: quotations.accountedBy },
          attributes: { exclude: ['password'] },
          raw: true
        });
        const location: any = await LocationModel.findOne({
          where: { id: quotations.locationId },
          raw: true
        });
        const customerWisere: any = await CustomerWisereModel.findOne({
          where: { id: quotations.customerId },
          raw: true
        });
        const quotationsDentalDetailsData: any = quotations.quotationsDentalDetails;
        for (let i = 0; i < quotationsDentalDetailsData.length; i++) {
          const service: any = await ServiceModel.findOne({
            where: { id: quotationsDentalDetailsData[i].serviceId },
            raw: true
          });
          const staff = await StaffModel.findOne({ where: { id: quotationsdentalDetailsData[i].staffId }, raw: true });
          quotationsdentalDetailsData[i] = {
            ...quotationsdentalDetailsData[i]._doc,
            service: service,
            staff: staff
          };
        }
        let quotationsDental: any = {
          ...quotations._doc,
          quotationsDentalDetails: quotationsDentalDetailsData,
          accountedBy: accountedBy,
          location: location,
          customerWisere: customerWisere
        };

        quotationsDental.quotationsDentalDetails = quotationsDental.quotationsDentalDetails.map((item: any) => {
          item = _.omit(item, ['serviceId']);
          return item;
        });
        quotationsDental = _.omit(quotationsDental, ['locationId', 'customerId']);
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotationsDental));
      } else {
        return res.status(httpStatus.OK).send(buildSuccessMessage(quotations));
      }
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
      const newProcedures: any = [];
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
          await QuotationsDentalDetailModel.updateOne({ _id: qdDetail._id }, quotationsDentalDetail).exec();
          flagNewProcedure = !qdDetail.isAccept && quotationsDentalDetail.isAccept;
        } else {
          const quotationsDentalDetails = new QuotationsDentalDetailModel({
            ...quotationsDentalDetail,
            quotationsDentalId: quotationsDental._id
          });
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
          newProcedures.push(
            _.omit(newProcedure, ['isAccept', 'quotationsDentalId', 'currencyUnit', 'tax', 'teethType', 'teethNumbers'])
          );
        }
      }
      if (newProcedures.length) {
        await ProcedureModel.insertMany(newProcedures);
      }
      const quotationsDentalDetailsData: any = await QuotationsDentalDetailModel.find({
        quotationsDentalId: quotationsDental._id
      }).exec();
      const totalPrice = quotationsDentalDetailsData.reduce((acc: number, item: any) => acc + item.price, 0);
      quotationsDental.totalPrice = totalPrice;
      await quotationsDental.save();
      const quotationDetailsResult = await QuotationsDentalModel.findById(quotationsId)
        .populate({
          path: 'quotationsDentalDetails',
          model: 'QuotationsDentalDetail'
        })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(quotationDetailsResult));
    } catch (error) {
      return next(error);
    }
  };
}
