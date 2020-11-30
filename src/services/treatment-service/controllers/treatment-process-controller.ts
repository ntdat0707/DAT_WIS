import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import {
  TreatmentProcessModel,
  ProcedureModel,
  PrescriptionModel,
  MedicineModel
} from '../../../repositories/mongo/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  createTreatmentProcessSchema,
  updateTreatmentProcessSchema
} from '../configs/validate-schemas/treatment-process';
import { LocationModel, ServiceModel } from '../../../repositories/postgres/models';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { treatmentIdSchema, treatmentProcessIdSchema } from '../configs/validate-schemas';

export class TreatmentProcessController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   TreatmentProcessCreate:
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
   *                   type: object
   *                   properties:
   *                        diagnosis:
   *                            type: string
   *                        note:
   *                            type: string
   *                        drugList:
   *                            type: array
   *                            items:
   *                                type: object
   *                                properties:
   *                                    medicineId:
   *                                        type: string
   *                                    quantity:
   *                                        type: number
   */
  /**
   * @swagger
   * /treatment/treatment-process/create:
   *   post:
   *     tags:
   *       - TreatmentProcess
   *     security:
   *       - Bearer: []
   *     name: createTreatmentProcess
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/TreatmentProcessCreate'
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
      const createdById = res.locals.staffPayload.id;
      const dataInput = { ...req.body, createdById: createdById };
      const validateErrors = validate(dataInput, createTreatmentProcessSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const location = await LocationModel.findOne({ where: { id: dataInput.locationId } });
      if (!location) {
        throw new CustomError(
          locationErrorDetails.E_1000(`Location ${dataInput.locationId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const creator = await StaffModel.findOne({ where: { id: dataInput.createdById } });
      if (!creator) {
        throw new CustomError(staffErrorDetails.E_4000(`Creator ${dataInput.createdById} not found`));
      }
      const procedureIds: any = [];
      for (const item of req.body.procedures) {
        await ProcedureModel.updateOne(
          { _id: item.id },
          { status: item.status, detailTreatment: item.detailTreatment }
        ).exec();
        procedureIds.push(item.id);
      }
      dataInput.procedureIds = procedureIds;
      if (dataInput.prescription) {
        const prescriptionData = { ...dataInput.prescription };

        const prescription: any = new PrescriptionModel(prescriptionData);
        dataInput.prescriptionId = prescription._id;
        await prescription.save();
      }
      const treatmentProcess = new TreatmentProcessModel(dataInput);
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
   *       - TreatmentProcess
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
   *       - TreatmentProcess
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
   *       - TreatmentProcess
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
   *   TreatmentProcessUpdate:
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
   *                   type: object
   *                   properties:
   *                        prescriptionId:
   *                            type: string
   *                        diagnosis:
   *                            type: string
   *                        note:
   *                            type: string
   *                        drugList:
   *                            type: array
   *                            items:
   *                                type: object
   *                                properties:
   *                                    medicineId:
   *                                        type: string
   *                                    quantity:
   *                                        type: number
   */
  /**
   * @swagger
   * /treatment/treatment-process/update/{treatmentProcessId}:
   *   put:
   *     tags:
   *       - TreatmentProcess
   *     security:
   *       - Bearer: []
   *     name: updateTreatmentProcess
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/TreatmentProcessUpdate'
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
  public updateTreatmentProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createdById = res.locals.staffPayload.id;
      const treatmentProcessId = req.params.treatmentProcessId;
      const dataInput = { ...req.body, treatmentProcessId: treatmentProcessId, createdById: createdById };
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
      if (dataInput.locationId) {
        const location = await LocationModel.findOne({ where: { id: dataInput.locationId } });
        if (!location) {
          throw new CustomError(
            locationErrorDetails.E_1000(`Location ${dataInput.locationId} not found`),
            httpStatus.NOT_FOUND
          );
        }
      }
      if (dataInput.createdById) {
        const creator: any = await StaffModel.findOne({ where: { id: dataInput.createdById } });
        if (!creator) {
          throw new CustomError(staffErrorDetails.E_4000(`Creator ${dataInput.createdById} not found`));
        }
      }
      if (dataInput.procedures) {
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
      }
      if (dataInput.prescription) {
        if (!dataInput.prescription.prescriptionId) {
          const prescriptionData = { ...dataInput.prescription };
          const prescription: any = new PrescriptionModel(prescriptionData);
          await prescription.save();
        } else {
          const prescription: any = await PrescriptionModel.findById(dataInput.prescription.prescriptionId).exec();
          if (!prescription) {
            throw new CustomError(
              treatmentErrorDetails.E_3909(`Prescription ${dataInput.prescription.prescriptionId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          const prescriptionData = { ...dataInput.prescription };
          await PrescriptionModel.updateOne({ _id: dataInput.prescription.prescriptionId }, prescriptionData).exec();
        }
      }
      await TreatmentProcessModel.updateOne({ _id: treatmentProcessId }, dataInput).exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };
}
