import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../../utils/error-handlers';
import { validate, baseValidateSchemas } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import {
  TreatmentProcessModel,
  ProcedureModel,
  PrescriptionModel,
  MedicineModel,
  LaboModel,
  TreatmentModel
} from '../../../repositories/mongo/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  createTreatmentProcessSchema,
  updateTreatmentProcessSchema
} from '../../treatment-service/configs/validate-schemas';
import { CustomerWisereModel, LocationModel, ServiceModel } from '../../../repositories/postgres/models';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { customerErrorDetails, treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import {
  treatmentIdSchema,
  treatmentProcessIdSchema,
  nameTherapeuticSchema,
  therapeuticIdSchema
} from '../configs/validate-schemas';
import httpStatus from 'http-status';
import _ from 'lodash';
import { serviceIdSchema } from '../../branch-service/configs/validate-schemas';
import { TherapeuticTreatmentModel } from '../../../repositories/mongo/models/therapeutic-treatment-model';
import { EStatusProcedure } from '../../../utils/consts';
import { ServiceTherapeuticModel } from '../../../repositories/mongo/models/service-therapeutic-model';
import { LaboTypeModel } from '../../../repositories/postgres/models/labo-type-model';
import {paginateMongo} from '../../../utils/paginator';

export class TreatmentProcessController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   laboCreate:
   *       type: object
   *       properties:
   *           status:
   *               type: string
   *               enum: ['ordered', 'deliveried']
   *           customerId:
   *               type: string
   *           staffId:
   *               type: string
   *           laboTypeId:
   *               type: string
   *           sentDate:
   *               type: string
   *               format: date
   *           receivedDate:
   *               type: string
   *               format: date
   *           diagnostic:
   *               type: string
   *           note:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   prescriptionCreate:
   *       type: object
   *       properties:
   *           diagnosis:
   *               type: string
   *           note:
   *               type: string
   *           drugList:
   *               type: array
   *               items:
   *                   type: object
   *                   properties:
   *                       medicineId:
   *                          type: string
   *                       quantity:
   *                          type: integer
   *                       note:
   *                           type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   treatmentProcessCreate:
   *       required:
   *           - name
   *           - locationId
   *           - treatmentId
   *           - procedures
   *           - status
   *       properties:
   *           name:
   *               type: string
   *           locationId:
   *               type: string
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           createOn:
   *               type: string
   *               format: date
   *           procedures:
   *               type: array
   *               items:
   *                   type: object
   *                   properties:
   *                      procedureId:
   *                        type: string
   *                      progress:
   *                        type: integer
   *                      assistantId:
   *                        type: string
   *                      detailTreatment:
   *                        type: string
   *           prescription:
   *               $ref: '#/definitions/prescriptionCreate'
   *           labo:
   *               $ref: '#/definitions/laboCreate'
   *
   */

  /**
   * @swagger
   * /treatment/treatment-process/create:
   *   post:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: createTreatmentProcess
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/treatmentProcessCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createTreatmentProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createTreatmentProcessSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const createdById = res.locals.staffPayload.id;
      const treatmentProcessData = { ...req.body, createdById: createdById };
      const location = await LocationModel.findOne({ where: { id: treatmentProcessData.locationId } });
      if (!location) {
        throw new CustomError(
          locationErrorDetails.E_1000(`Location ${treatmentProcessData.locationId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const treatment = await TreatmentModel.findById(treatmentProcessData.treatmentId).exec();
      if (!treatment) {
        throw new CustomError(
          treatmentErrorDetails.E_3902(`treatmentId ${treatmentProcessData.treatmentId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      //Procedure
      for (let i = 0; i < treatmentProcessData.procedures.length; i++) {
        const procedure = await ProcedureModel.findById(treatmentProcessData.procedures[i].procedureId).exec();
        if (!procedure) {
          throw new CustomError(
            treatmentErrorDetails.E_3905(`procedureId ${treatmentProcessData.procedures[i].procedureId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        if (treatmentProcessData.procedures[i].progress) {
          if (treatmentProcessData.procedures[i].progress > 0 && treatmentProcessData.procedures[i].progress < 100) {
            procedure.status = EStatusProcedure.INPROGRESS;
          } else if (treatmentProcessData.procedures[i].progress === 100) {
            procedure.status = EStatusProcedure.COMPLETE;
          }
          procedure.progress = treatmentProcessData.procedures[i].progress;
        } else {
          procedure.progress = 0;
        }
        await ProcedureModel.updateOne({ _id: treatmentProcessData.procedures[i].procedureId }, procedure).exec();
        //AssistantId --Pending
      }
      if (treatmentProcessData.prescription) {
        const prescription: any = new PrescriptionModel(treatmentProcessData.prescription);
        treatmentProcessData.prescriptionId = prescription._id;
        await prescription.save();
      }
      if (treatmentProcessData.labo) {
        const customer = await CustomerWisereModel.findOne({ where: { id: treatmentProcessData.labo.customerId } });
        if (!customer) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${treatmentProcessData.labo.customerId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const staff = await StaffModel.findOne({ where: { id: treatmentProcessData.labo.staffId } });
        if (!staff) {
          throw new CustomError(
            staffErrorDetails.E_4000(`staff Id ${treatmentProcessData.labo.staffId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const laboType = await LaboTypeModel.findOne({ where: { id: treatmentProcessData.labo.laboTypeId } });
        if (!laboType) {
          throw new CustomError(
            treatmentErrorDetails.E_3915(`Labo type ${treatmentProcessData.labo.laboTypeId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const laboData = {
          ...treatmentProcessData.labo,
          customerId: customer.id,
          customerName: customer.firstName,
          staffId: staff.id,
          staffName: staff.firstName,
          laboTypeName: laboType.name
        };
        const labo = new LaboModel(laboData);
        treatmentProcessData.laboId = labo._id;
        await labo.save();
      }
      const treatmentProcess = new TreatmentProcessModel(treatmentProcessData);
      await treatmentProcess.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-medicines:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getAllMedicine
   *     parameters:
   *       - in: query
   *         name: pageNum
   *         required: true
   *         schema:
   *            type: integer
   *       - in: query
   *         name: pageSize
   *         required: true
   *         schema:
   *            type: integer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllMedicine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }

      const queryMedicine = {};
      const medicines = await paginateMongo(
        MedicineModel,
        queryMedicine,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(httpStatus.OK).send(buildSuccessMessage(medicines));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-all-treatment-process/{treatmentId}:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getAllTreatmentProcess
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
  public getAllTreatmentProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentId = req.params.treatmentId;
      const validateErrors = validate(treatmentId, treatmentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatmentProcess: any = await TreatmentProcessModel.find({ treatmentId: treatmentId }).exec();
      for (let i = 0; i < treatmentProcess.length; i++) {
        const staff = await StaffModel.findOne({
          where: { id: treatmentProcess[i].createdById },
          attributes: { exclude: ['password'] }
        });
        treatmentProcess[i] = {
          ...treatmentProcess[i]._doc,
          createdBy: staff,
          createdById: undefined
        };
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-treatment-process/{treatmentProcessId}:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getTreatmentProcess
   *     parameters:
   *     - in: path
   *       name: treatmentProcessId
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
  public getTreatmentProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentProcessId = req.params.treatmentProcessId;
      const validateErrors = validate(treatmentProcessId, treatmentProcessIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let treatmentProcess: any = await TreatmentProcessModel.findById({ _id: treatmentProcessId })
        .populate({
          path: 'procedures',
          populate: { path: 'procedureId', model: 'Procedure', populate: { path: 'teethId', model: 'Teeth' } }
        })
        .populate('prescriptionId')
        .populate('laboId')
        .exec();
      if (!treatmentProcess) {
        throw new CustomError(
          treatmentErrorDetails.E_3910(`Treatment process ${treatmentProcessId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const creator = await StaffModel.findOne({
        where: { id: treatmentProcess.createdById },
        attributes: { exclude: ['password'] }
      });
      if (treatmentProcess.laboId) {
        const labo = treatmentProcess.laboId ? treatmentProcess.laboId : '';
        const laboStaff = await StaffModel.findOne({ where: { id: labo.staffId } });
        treatmentProcess = {
          ...treatmentProcess._doc,
          labo: labo,
          laboId: undefined,
          createdBy: creator,
          createdById: undefined
        };
        treatmentProcess.labo = {
          ...treatmentProcess.labo._doc,
          staff: laboStaff,
          staffName: undefined,
          staffId: undefined
        };
      } else {
        treatmentProcess = {
          ...treatmentProcess._doc,
          createdBy: creator,
          createdById: undefined
        };
      }
      for (let i = 0; i < treatmentProcess.procedures.length; i++) {
        const service = await ServiceModel.findOne({
          where: { id: treatmentProcess.procedures[i].procedureId.serviceId },
          raw: true
        });
        const staff = await StaffModel.findOne({
          where: { id: treatmentProcess.procedures[i].procedureId.staffId },
          raw: true
        });
        let assistant = null;
        if (treatmentProcess.procedures[i].assistantId) {
          assistant = await StaffModel.findOne({
            where: { id: treatmentProcess.procedures[i].assistantId },
            raw: true
          });
        }

        treatmentProcess.procedures[i] = {
          ...treatmentProcess.procedures[i]._doc,
          ...treatmentProcess.procedures[i].procedureId._doc,
          service: service,
          staff: staff,
          assistant: assistant,
          assistantId: undefined,
          staffId: undefined,
          serviceId: undefined,
          procedureId: undefined
        };
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   laboUpdate:
   *       type: object
   *       properties:
   *           laboId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['ordered', 'deliveried']
   *           customerId:
   *               type: string
   *           staffId:
   *               type: string
   *           laboTypeId:
   *               type: string
   *           sentDate:
   *               type: string
   *               format: date
   *           receivedDate:
   *               type: string
   *               format: date
   *           diagnostic:
   *               type: string
   *           note:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   prescriptionUpdate:
   *       type: object
   *       properties:
   *           prescriptionId:
   *               type: string
   *           diagnosis:
   *               type: string
   *           note:
   *               type: string
   *           drugList:
   *               type: array
   *               items:
   *                   type: object
   *                   properties:
   *                       medicineId:
   *                          type: string
   *                       quantity:
   *                          type: integer
   *                       note:
   *                           type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   treatmentProcessUpdate:
   *       properties:
   *           name:
   *               type: string
   *           locationId:
   *               type: string
   *           note:
   *               type: string
   *           createOn:
   *               type: string
   *               format: date
   *           procedures:
   *               type: array
   *               items:
   *                   type: object
   *                   properties:
   *                      procedureId:
   *                        type: string
   *                      progress:
   *                        type: integer
   *                      assistantId:
   *                        type: string
   *                      detailTreatment:
   *                        type: string
   *           prescription:
   *               $ref: '#/definitions/prescriptionUpdate'
   *           labo:
   *               $ref: '#/definitions/laboUpdate'
   *
   */
  /**
   * @swagger
   * /treatment/treatment-process/update/{treatmentProcessId}:
   *   put:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: updateTreatmentProcess
   *     parameters:
   *     - in: path
   *       name: treatmentProcessId
   *       type: string
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/treatmentProcessUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateTreatmentProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentProcessId = req.params.treatmentProcessId;
      const dataInput = { ...req.body, treatmentProcessId: treatmentProcessId };
      const validateErrors = validate(dataInput, updateTreatmentProcessSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatmentProcess: any = await TreatmentProcessModel.findById({ _id: treatmentProcessId }).exec();
      if (!treatmentProcess) {
        throw new CustomError(
          treatmentErrorDetails.E_3910(`Treatment process ${treatmentProcessId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const location = await LocationModel.findOne({ where: { id: dataInput.locationId } });
      if (!location) {
        throw new CustomError(
          locationErrorDetails.E_1000(`Location ${dataInput.locationId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      if (dataInput.procedures.length > treatmentProcess.procedures.length) {
        throw new CustomError(treatmentErrorDetails.E_3911(`Procedures input not valid`), httpStatus.BAD_REQUEST);
      }
      //Procedures
      for (const item of dataInput.procedures) {
        const procedure = await ProcedureModel.findById(item.procedureId).exec();
        const currProcedures = treatmentProcess.procedures.map((x: any) => x.procedureId.toString());
        const inputProcedures = dataInput.procedures.map((p: any) => p.procedureId.toString());
        if (currProcedures.length > inputProcedures.length) {
          if (!currProcedures.includes(inputProcedures)) {
            throw new CustomError(
              treatmentErrorDetails.E_3913(
                `Procedure ${inputProcedures} not in this treatment process ${treatmentProcessId}`
              ),
              httpStatus.NOT_FOUND
            );
          }
        } else {
          const diffProcedure = _.difference(currProcedures, inputProcedures);
          if (diffProcedure.length > 0) {
            throw new CustomError(
              treatmentErrorDetails.E_3913(
                `Procedure ${diffProcedure} not in this treatment process ${treatmentProcessId}`
              ),
              httpStatus.NOT_FOUND
            );
          }
        }
        if (item.progress > 0 && item.progress < 100) {
          procedure.status = EStatusProcedure.INPROGRESS;
        } else if (item.progress === 100) {
          procedure.status = EStatusProcedure.COMPLETE;
        }
        procedure.progress = item.progress;
        await ProcedureModel.updateOne({ _id: item.procedureId }, procedure).exec();
      }
      if (dataInput.prescription) {
        if (!dataInput.prescription.prescriptionId) {
          const prescription: any = new PrescriptionModel(dataInput.prescription);
          dataInput.prescriptionId = prescription._id;
          await prescription.save();
        } else {
          const prescription: any = await PrescriptionModel.findById(dataInput.prescription.prescriptionId).exec();
          if (!prescription) {
            throw new CustomError(
              treatmentErrorDetails.E_3909(`Prescription ${dataInput.prescription.prescriptionId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          await PrescriptionModel.updateOne(
            { _id: dataInput.prescription.prescriptionId },
            dataInput.prescription
          ).exec();
        }
      }
      if (dataInput.labo) {
        const customer = await CustomerWisereModel.findOne({ where: { id: dataInput.labo.customerId } });
        if (!customer) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${dataInput.labo.customerId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const staff = await StaffModel.findOne({ where: { id: dataInput.labo.staffId } });
        if (!staff) {
          throw new CustomError(
            staffErrorDetails.E_4000(`staff Id ${dataInput.labo.staffId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const laboType = await LaboTypeModel.findOne({ where: { id: dataInput.labo.laboTypeId } });
        if (!laboType) {
          throw new CustomError(
            treatmentErrorDetails.E_3915(`Labo type ${dataInput.labo.laboTypeId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        if (!dataInput.labo.laboId) {
          const laboData = {
            ...dataInput.labo,
            customerId: customer.id,
            customerName: customer.firstName,
            staffId: staff.id,
            staffName: staff.firstName,
            laboTypeName: laboType.name
          };
          const labo = new LaboModel(laboData);
          dataInput.laboId = labo._id;
          await labo.save();
        } else {
          const labo = await LaboModel.findById(dataInput.labo.laboId).exec();
          if (!labo) {
            throw new CustomError(
              treatmentErrorDetails.E_3907(`laboId ${dataInput.labo.laboId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          const laboData = {
            ...dataInput.labo,
            customerId: customer.id,
            customerName: customer.firstName,
            staffId: staff.id,
            staffName: staff.firstName,
            laboTypeName: laboType.name
          };
          await LaboModel.updateOne({ _id: dataInput.labo.laboId }, laboData).exec();
        }
      }
      dataInput.createdById = treatmentProcess.createdById;
      await TreatmentProcessModel.updateOne({ _id: treatmentProcessId }, dataInput).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-therapeutic/{serviceId}:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getTherapeutic
   *     parameters:
   *     - in: path
   *       name: serviceId
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
  public getTherapeutic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceId = req.params.serviceId;
      const validateErrors = validate(serviceId, serviceIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const therapeutic = (await ServiceTherapeuticModel.find({ serviceId: serviceId }).exec()).map((item: any) => ({
        _id: item.therapeuticId,
        name: item.name
      }));
      return res.status(httpStatus.OK).send(buildSuccessMessage(therapeutic));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-all-therapeutic:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getAllTherapeutic
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllTherapeutic = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const therapeutic = await TherapeuticTreatmentModel.find().select('name therapeuticId').exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(therapeutic));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/create-therapeutic:
   *   post:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: createTherapeutic
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       properties:
   *            name:
   *                 type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createTherapeutic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        name: req.body.name
      };
      const validateErrors = validate(data.name, nameTherapeuticSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const checkExistName = await TherapeuticTreatmentModel.findOne({ name: data.name }).exec();
      if (checkExistName) {
        throw new CustomError(treatmentErrorDetails.E_3906(`name  ${data.name} exists`), httpStatus.BAD_REQUEST);
      }
      const therapeutic = await TherapeuticTreatmentModel.create(data);
      return res.status(httpStatus.OK).send(buildSuccessMessage(therapeutic));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/delete-therapeutic/{therapeuticId}:
   *   delete:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: deleteTherapeutic
   *     parameters:
   *     - in: path
   *       name: therapeuticId
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
  public deleteTherapeutic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const therapeuticId = req.params.therapeuticId;
      const validateErrors = validate(therapeuticId, therapeuticIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const therapeutic = await TherapeuticTreatmentModel.findById(therapeuticId).exec();
      if (!therapeutic) {
        throw new CustomError(
          treatmentErrorDetails.E_3914(`therapeuticId  ${therapeuticId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await TherapeuticTreatmentModel.findByIdAndDelete(therapeuticId).exec();
      await ServiceTherapeuticModel.deleteMany({ therapeuticId: therapeuticId }).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/treatment-process/get-all-labo-type:
   *   get:
   *     tags:
   *       - Treatment Process
   *     security:
   *       - Bearer: []
   *     name: getAllLaboType
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllLaboType = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const laboTypes = await LaboTypeModel.findAll({ attributes: ['id', 'name'] });
      return res.status(httpStatus.OK).send(buildSuccessMessage(laboTypes));
    } catch (error) {
      return next(error);
    }
  };
}
