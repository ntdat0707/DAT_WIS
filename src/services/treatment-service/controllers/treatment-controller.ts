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
  treatmentIdSchema
} from '../configs/validate-schemas';
import {
  customerErrorDetails,
  staffErrorDetails,
  treatmentErrorDetails
} from '../../../utils/response-messages/error-details';
import _ from 'lodash';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { TeethModel, ProcedureModel, TreatmentModel } from '../../../repositories/mongo/models';

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
   *           teethNumber:
   *               type: array
   *               items:
   *                   type: integer
   *           serviceId:
   *               type: string
   *           quantity:
   *               type: integer
   *           discount:
   *               type: integer
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
      for (let i = 0; i < req.body.procedures.length; i++) {
        const teethIds = [];
        for (let j = 0; j < req.body.procedures[i].teethNumber.length; j++) {
          const teeth: any = await TeethModel.findOne({
            toothNumber: req.body.procedures[i].teethNumber[j]
          }).exec();
          if (!teeth) {
            throw new CustomError(
              treatmentErrorDetails.E_3900(`teeth number ${req.body.procedures[i].teethNumber[j]} not found`),
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
        if (req.body.procedures[i].discount) {
          discount = (service.salePrice * req.body.procedures[i].discount) / 100;
        }
        const totalPrice = req.body.procedures[i].quantity * service.salePrice - discount;
        if (req.body.procedures[i].totalPrice !== totalPrice) {
          throw new CustomError(treatmentErrorDetails.E_3901('total price is incorrect'), httpStatus.BAD_REQUEST);
        }
        const data = {
          treatmentId: req.body.treatmentId,
          serviceName: service.name,
          price: service.salePrice,
          ...req.body.procedures[i]
        };
        data.teethId = teethIds;
        dataProcedures.push(data);
      }
      const procedures = await ProcedureModel.insertMany(dataProcedures);
      const procudredIds: any = [];
      for (const procedure of procedures) {
        procudredIds.push(procedure._id);
      }
      treatment.procedureIds = procudredIds;
      await TreatmentModel.update({ _id: treatment._id }, treatment).exec();
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
      })
        .populate({ path: 'diagnosisIds', model: 'DiagnosisModel' })
        .populate({ path: 'procedureIds', model: 'ProcedureModel' })
        .populate({ path: 'treatmentProcessIds', model: 'TreatmentProcessModel' })
        .exec();
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
      const procedures = await ProcedureModel.find({ treatmentId: treatmentId }).exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(procedures));
    } catch (error) {
      return next(error);
    }
  };
}
