import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import {
  CustomerWisereModel,
  MedicalHistoryCustomerModel,
  MedicalHistoryModel,
  sequelize,
  ServiceModel,
  StaffModel
} from '../../../repositories/postgres/models';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import {
  languageSchema,
  customerWisereIdSchema,
  updateMedicalHistorySchema,
  createProcedureSchema,
  createTreatmentSchema,
  treatmentIdSchema,
  procedureSchema
} from '../configs/validate-schemas';
import {
  customerErrorDetails,
  staffErrorDetails,
  treatmentErrorDetails
} from '../../../utils/response-messages/error-details';
import _ from 'lodash';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import {
  TeethModel,
  TreatmentModel,
  ProcedureModel,
  QuotationsDentalModel,
  QuotationsDentalDetailModel
} from '../../../repositories/mongo/models';
import { EQuotationDiscountType, EStatusProcedure } from '../../../utils/consts';

export class TreatmentController extends BaseController {
  /**
   * @swagger
   * /treatment/get-all-medical-history:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllMedicalHistory
   *     parameters:
   *     - in: query
   *       name: language
   *       type: string
   *       enum: ['en', 'vi']
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = req.query.language;
      const validateErrors = validate(language, languageSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let listMedicalHistory: any;
      if (language === 'en') {
        listMedicalHistory = await MedicalHistoryModel.findAll({
          attributes: ['id', 'name']
        });
      } else {
        listMedicalHistory = await MedicalHistoryModel.findAll({
          attributes: ['id', 'nameVi']
        });
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(listMedicalHistory));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/get-medical-history-by-customer/{customerWisereId}:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getMedicalHistoryByCustomer
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getMedicalHistoryByCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(customerWisereId, customerWisereIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let listMedicalHistory: any = await MedicalHistoryModel.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        include: [
          {
            model: CustomerWisereModel,
            as: 'customers',
            where: { id: customerWisereId },
            attributes: ['id'],
            through: { attributes: ['note'] }
          }
        ]
      });
      listMedicalHistory = listMedicalHistory.map((medicalHistory: any) => ({
        ...medicalHistory.dataValues,
        ...medicalHistory.customers[0]?.MedicalHistoryCustomerModel?.dataValues,
        customers: undefined
      }));
      return res.status(httpStatus.OK).send(buildSuccessMessage(listMedicalHistory));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   medicalHistory:
   *       properties:
   *          medicalHistoryId:
   *             type: string
   *          note:
   *             type: string
   *
   */

  /**
   * @swagger
   * /treatment/update-medical-history-of-customer/{customerWisereId}:
   *   put:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: updateMedicalHistoryOfCustomer
   *     parameters:
   *     - in: "path"
   *       name: "customerWisereId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       properties:
   *          medicalHistories:
   *              type: array
   *              items:
   *                  $ref: '#/definitions/medicalHistory'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateMedicalHistoryOfCustomer = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(req.body, updateMedicalHistorySchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const customerWisere: any = await CustomerWisereModel.findOne({
        where: { id: customerWisereId },
        include: [
          {
            model: MedicalHistoryModel,
            as: 'medicalHistories',
            required: false,
            attributes: ['id'],
            through: { attributes: [] }
          }
        ]
      });
      if (!customerWisere) {
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const currentMedicalHistory: string[] = customerWisere.medicalHistories.map((item: any) => item.id);
      const dataInput: string[] = req.body.medicalHistories.map((item: any) => item.medicalHistoryId);
      const removeMedicalHistory = _.difference(currentMedicalHistory, dataInput);
      transaction = await sequelize.transaction();
      if (removeMedicalHistory.length > 0) {
        await MedicalHistoryCustomerModel.destroy({
          where: { customerWisereId: customerWisereId, medicalHistoryId: removeMedicalHistory },
          transaction
        });
      }
      const addMedicalHistory = _.difference(dataInput, currentMedicalHistory);
      if (addMedicalHistory.length > 0) {
        const listMedicalHistory = [];
        for (let i = 0; i < addMedicalHistory.length; i++) {
          const index = req.body.medicalHistories.findIndex((x: any) => x.medicalHistoryId === addMedicalHistory[i]);
          const data = {
            customerWisereId: customerWisereId,
            medicalHistoryId: addMedicalHistory[i],
            note: req.body.medicalHistories[index].note
          };
          listMedicalHistory.push(data);
        }
        await MedicalHistoryCustomerModel.bulkCreate(listMedicalHistory, { transaction });
      }
      const updateMedicalHistory = _.intersection(dataInput, currentMedicalHistory);
      if (updateMedicalHistory.length > 0) {
        for (let j = 0; j < updateMedicalHistory.length; j++) {
          const index = req.body.medicalHistories.findIndex((x: any) => x.medicalHistoryId === updateMedicalHistory[j]);
          await MedicalHistoryCustomerModel.update(
            {
              note: req.body.medicalHistories[index].note
            },
            {
              where: { customerWisereId: customerWisereId, medicalHistoryId: updateMedicalHistory[j] },
              transaction
            }
          );
        }
      }
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   procedureCreate:
   *       properties:
   *           staffId:
   *               type: string
   *           teethNumbers:
   *               type: array
   *               items:
   *                   type: string
   *           serviceId:
   *               type: string
   *           quantity:
   *               type: integer
   *           discount:
   *               type: integer
   *           discountType:
   *               type: string
   *               enum: ['percent', 'money']
   *           totalPrice:
   *               type: integer
   *           note:
   *               type: string
   *
   */
  /**
   * @swagger
   * /treatment/create-procedures:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createProcedures
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       properties:
   *           treatmentId:
   *               type: string
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           procedures:
   *               type: array
   *               items:
   *                    $ref: '#/definitions/procedureCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createProcedures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createProcedureSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const dataProcedures = [];
      const treatment: any = await TreatmentModel.findById({ _id: req.body.treatmentId }).exec();
      if (!treatment) {
        throw new CustomError(
          treatmentErrorDetails.E_3902(`treatmentId ${req.body.treatmentId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      // const { workingLocationIds } = res.locals.staffPayload;
      // if (!workingLocationIds.includes(req.body.locationId)) {
      //   throw new CustomError(
      //     branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
      //     httpStatus.FORBIDDEN
      //   );
      // }
      for (let i = 0; i < req.body.procedures.length; i++) {
        const teethIds = [];
        for (let j = 0; j < req.body.procedures[i].teethNumbers.length; j++) {
          const teeth: any = await TeethModel.findOne({
            toothNumber: parseInt(req.body.procedures[i].teethNumbers[j], 10)
          }).exec();
          if (!teeth) {
            throw new CustomError(
              treatmentErrorDetails.E_3900(`teeth number ${req.body.procedures[i].teethNumbers[j]} not found`),
              httpStatus.NOT_FOUND
            );
          }
          teethIds.push(teeth._id);
        }
        const staff = await StaffModel.findOne({ where: { id: req.body.procedures[i].staffId } });
        if (!staff) {
          throw new CustomError(
            staffErrorDetails.E_4000(`staffId ${req.body.procedures[i].staffId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const service = await ServiceModel.findOne({ where: { id: req.body.procedures[i].serviceId } });
        if (!service) {
          throw new CustomError(
            serviceErrorDetails.E_1203(`serviceId ${req.body.procedures[i].serviceId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        let discount = 0;
        if (req.body.procedures[i].discount && req.body.procedures[i].discountType) {
          if (req.body.procedures[i].discountType === EQuotationDiscountType.PERCENT) {
            discount = (service.salePrice * req.body.procedures[i].discount) / 100;
          } else {
            discount = req.body.procedures[i].discount;
          }
        }
        const totalPrice = req.body.procedures[i].quantity * service.salePrice - discount;
        if (req.body.procedures[i].totalPrice !== totalPrice) {
          throw new CustomError(treatmentErrorDetails.E_3901('total price is incorrect'), httpStatus.BAD_REQUEST);
        }
        const data = {
          treatmentId: req.body.treatmentId,
          locationId: req.body.locationId,
          customerId: req.body.customerId,
          serviceName: service.name,
          price: service.salePrice,
          ...req.body.procedures[i]
        };
        data.teethId = teethIds;
        dataProcedures.push(data);
      }
      const procedures = await ProcedureModel.insertMany(dataProcedures);
      const procedureIds: any = [];
      for (const procedure of procedures) {
        procedureIds.push(procedure._id);
      }
      let isQuotation: boolean;
      let quotationsDentalData: any = {};
      await QuotationsDentalModel.findOne({ treatmentId: req.body.treatmentId }, (err: any, quotations: any) => {
        if (err) throw err;
        if (quotations) {
          isQuotation = true;
        } else {
          isQuotation = false;
        }
      }).exec();
      if (isQuotation === false) {
        quotationsDentalData = {
          date: Date.now(),
          treatmentId: req.body.treatmentId,
          locationId: req.body.locationId,
          accountedBy: res.locals.staffPayload.id,
          customerId: req.body.customerId
        };
        const quotationsDental = new QuotationsDentalModel(quotationsDentalData);
        quotationsDental.save();

        const quotationsId = quotationsDental._id;
        let quotationsDentalDetailsData: any = [];
        quotationsDentalDetailsData = dataProcedures.map((element: any) => {
          delete Object.assign(element, { ['price']: element.totalPrice }).totalPrice;
          delete element.price;
          delete element.note;
          delete element.treatmentId;
          delete element.customerId;
          delete element.locationId;
          delete element.serviceName;
          element.quotationsDentalId = quotationsId;
          element.isAccept = true;
          delete element.teethId;
          return element;
        });
        let id: any;
        let detailsIds: any = [];
        await QuotationsDentalDetailModel.insertMany(quotationsDentalDetailsData, (result: any) => {
          id = result.map((a: any) => a.quotationsDentalId);
          detailsIds = result.map((i: any) => {
            return i._id;
          });
        });
        let totalPrice: number = 0;
        quotationsDentalDetailsData.map((b: any) => {
          totalPrice += b.price;
        });
        await QuotationsDentalModel.findByIdAndUpdate(
          { _id: id },
          { totalPrice: totalPrice, quotationDentalDetails: detailsIds }
        ).exec();
      } else {
        let quotationsId: any;
        let totalPrice: number;
        let detailsIds: any = [];
        const quotationsDental: any = await QuotationsDentalModel.findOne(
          { treatmentId: req.body.treatmentId },
          (err: any, quotations: any) => {
            if (err) throw err;
            quotationsId = quotations._id;
            detailsIds = quotations.quotationsDentalDetails;
          }
        ).exec();
        totalPrice = quotationsDental.totalPrice || 0;
        quotationsDental.quotationDentalDetails = quotationsDental.quotationDentalDetails || [];
        let quotationsDentalDetailsData: any = [];
        quotationsDentalDetailsData = dataProcedures.map((element: any) => {
          delete Object.assign(element, { ['price']: element.totalPrice }).totalPrice;
          delete element.note;
          delete element.treatmentId;
          delete element.customerId;
          delete element.locationId;
          delete element.serviceName;
          element.quotationsDentalId = quotationsId;
          element.isAccept = true;
          delete element.teethId;
          return element;
        });
        quotationsDentalDetailsData.map((b: any) => {
          totalPrice += b.price;
        });
        const quotationDentalDetails: any = await QuotationsDentalDetailModel.insertMany(quotationsDentalDetailsData);
        quotationDentalDetails.map((item: any) => {
          detailsIds.push(item._id);
        });
        quotationsDental.totalPrice = totalPrice;
        detailsIds.map((item: any) => quotationsDental.quotationDentalDetails.push(item));
        //console.log('quotationdental:::', quotationsDental);
        await QuotationsDentalModel.updateOne({ _id: quotationsId }, quotationsDental, (err: any) => {
          if (err) throw err;
        }).exec();
      }
      treatment.procedureIds.push(procedureIds);
      await TreatmentModel.updateOne({ _id: treatment._id }, treatment).exec();

      return res.status(httpStatus.OK).send(buildSuccessMessage(procedures));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   treatmentCreate:
   *       properties:
   *           creatorId:
   *               type: string
   *           customerId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['planning', 'confirmed', 'completed']
   */
  /**
   * @swagger
   * /treatment/create-treatment:
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
   *          $ref: '#/definitions/treatmentCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createTreatment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createTreatmentSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const customerId = req.body.customerId;
      const numberOfTreatments: any = await TreatmentModel.count({ customerId: customerId }).exec();
      const treatmentNum = numberOfTreatments + 1;
      const treatmentName = `Treatment${treatmentNum.toString()}`;
      const treatmentCode = `TR${treatmentNum.toString()}`;
      const data = {
        name: treatmentName,
        code: treatmentCode,
        customerId: req.body.customerId,
        creatorId: !req.body.creatorId ? res.locals.staffPayload.id : req.body.creatorId,
        status: req.body.status
      };
      const treatment = new TreatmentModel(data);
      const savedTreatment = await treatment.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(savedTreatment));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/get-all-treatment/{customerWisereId}:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllTreatment
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       type: string
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllTreatment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.params.customerWisereId;
      const validateErrors = validate(customerId, customerWisereIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatments = await TreatmentModel.find({
        customerId
      }).exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatments));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/get-all-procedure/{treatmentId}:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllProcedure
   *     parameters:
   *     - in: path
   *       name: treatmentId
   *       type: string
   *       required: true
   *     - in: query
   *       name: isTreatmentProcess
   *       type: boolean
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllProcedure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentId = req.params.treatmentId;
      const validateErrors = validate(treatmentId, treatmentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatment = await TreatmentModel.findOne({ _id: treatmentId }).exec();
      if (!treatment) {
        throw new CustomError(
          treatmentErrorDetails.E_3902(`treatmentId ${treatmentId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      let procedures: any = await ProcedureModel.find({ treatmentId: treatmentId }).populate('teethId').exec();
      for (let i = 0; i < procedures.length; i++) {
        const service = await ServiceModel.findOne({ where: { id: procedures[i].serviceId }, raw: true });
        const staff = await StaffModel.findOne({ where: { id: procedures[i].staffId }, raw: true });
        procedures[i] = {
          ...procedures[i]._doc,
          service: service,
          staff: staff,
          staffId: undefined,
          serviceId: undefined
        };
      }
      const isTreatmentProcess = req.query.isTreatmentProcess;
      if (isTreatmentProcess && isTreatmentProcess === 'true') {
        const treatmentProcess: any = await ProcedureModel.find({
          $and: [{ treatmentId: treatmentId }, { $or: [{ status: 'new' }, { status: 'in-progress' }] }]
        }).exec();
        for (let i = 0; i < treatmentProcess.length; i++) {
          const service = await ServiceModel.findOne({ where: { id: treatmentProcess[i].serviceId }, raw: true });
          const staff = await StaffModel.findOne({ where: { id: treatmentProcess[i].staffId }, raw: true });
          treatmentProcess[i] = {
            ...treatmentProcess[i]._doc,
            service: service,
            staff: staff,
            staffId: undefined,
            serviceId: undefined
          };
          procedures = treatmentProcess;
        }
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(procedures));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/update-procedure/{procedureId}:
   *   put:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: updateProcedureReject
   *     parameters:
   *     - in: path
   *       name: procedureId
   *       type: string
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateProcedureReject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const procedureId = req.params.procedureId;
      const validateErrors = validate(procedureId, procedureSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const procedure = await ProcedureModel.findById(procedureId).exec();
      if (!procedure) {
        throw new CustomError(treatmentErrorDetails.E_3905(`Procedure ${procedureId} not found`), httpStatus.NOT_FOUND);
      }
      if (procedure.status !== EStatusProcedure.COMPLETE) {
        procedure.status = EStatusProcedure.REJECT;
      }
      await ProcedureModel.updateOne({ _id: procedureId }, procedure).exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(procedure));
    } catch (error) {
      return next(error);
    }
  };
}
