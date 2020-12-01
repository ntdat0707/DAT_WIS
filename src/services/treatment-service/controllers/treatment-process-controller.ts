import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
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
} from '../configs/validate-schemas/treatment-process';
import { CustomerWisereModel, LocationModel, ServiceModel } from '../../../repositories/postgres/models';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { customerErrorDetails, treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { treatmentIdSchema, treatmentProcessIdSchema } from '../configs/validate-schemas';

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
   *           labo:
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
   *                      id:
   *                        type: string
   *                      status:
   *                        type: string
   *                        enum: ['new','in-progress','completed','reject']
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
      const procedureIds: any = [];
      for (const item of req.body.procedures) {
        const procedure = await ProcedureModel.findById({ _id: item.id }).exec();
        if (!procedure) {
          throw new CustomError(treatmentErrorDetails.E_3905(`procedureId ${item.id} not found`), httpStatus.NOT_FOUND);
        }
        await ProcedureModel.updateOne(
          { _id: item.id },
          { status: item.status, detailTreatment: item.detailTreatment }
        ).exec();
        procedureIds.push(item.id);
      }
      treatmentProcessData.procedureIds = procedureIds;
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
        const labo = new LaboModel(treatmentProcessData.labo);
        treatmentProcessData.laboId = labo._id;
        await labo.save();
      }
      const treatmentProcess = new TreatmentProcessModel(treatmentProcessData);
      treatment.treatmentProcessIds.push(treatmentProcess._id);
      await TreatmentModel.updateOne({ _id: treatmentProcessData.treatmentId }, treatment).exec();
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
      const medicines = await MedicineModel.find({}).exec();
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
        .populate({ path: 'procedureIds', model: 'Procedure', populate: { path: 'teethId', model: 'Teeth' } })
        .populate('prescriptionId')
        .populate('laboId')
        .exec();
      const creator = await StaffModel.findOne({
        where: { id: treatmentProcess.createdById },
        attributes: { exclude: ['password'] }
      });
      treatmentProcess = {
        ...treatmentProcess._doc,
        createdBy: creator,
        createdById: undefined
      };
      for (let i = 0; i < treatmentProcess.procedureIds.length; i++) {
        const service = await ServiceModel.findOne({
          where: { id: treatmentProcess.procedureIds[i].serviceId },
          raw: true
        });
        const staff = await StaffModel.findOne({ where: { id: treatmentProcess.procedureIds[i].staffId }, raw: true });

        treatmentProcess.procedureIds[i] = {
          ...treatmentProcess.procedureIds[i]._doc,
          service: service,
          staff: staff,
          staffId: undefined,
          serviceId: undefined
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
   *           labo:
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
   *                      id:
   *                        type: string
   *                      status:
   *                        type: string
   *                        enum: ['new','in-progress','completed','reject']
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
      if (dataInput.procedures.length > treatmentProcess.procedureIds.length) {
        throw new CustomError(treatmentErrorDetails.E_3911(`Procedures input not valid`), httpStatus.BAD_REQUEST);
      }
      const procedureIds: any = [];
      for (const item of dataInput.procedures) {
        await ProcedureModel.updateOne(
          { _id: item.id },
          { status: item.status, detailTreatment: item.detailTreatment }
        ).exec();
        procedureIds.push(item.id);
      }
      dataInput.procedureIds = procedureIds;
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
        if (!dataInput.labo.laboId) {
          const labo = new LaboModel(dataInput.labo);
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
          await LaboModel.updateOne({ _id: dataInput.labo.laboId }, dataInput.labo).exec();
        }
      }
      dataInput.createdById = treatmentProcess.createdById;
      await TreatmentProcessModel.updateOne({ _id: treatmentProcessId }, dataInput).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
