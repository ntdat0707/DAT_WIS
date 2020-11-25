import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import {
  TreatmentProcessModel,
  ProcedureModel,
  TreatmentModel,
  PrescriptionModel
} from '../../../repositories/mongo/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createPrescriptionSchema, createTreatmentProcessSchema } from '../configs/validate-schemas/treatment-process';
import { LocationModel } from '../../../repositories/postgres/models/location';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details/treatment';

export class TreatmentProcessController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   TreatmentProcessCreate:
   *       required:
   *           - name
   *           - locationId
   *           - locationName
   *           - staffId
   *           - staffName
   *           - prescriptionId
   *           - treatmentId
   *           - createdById
   *           - createdByName
   *           - procedures
   *           - status
   *       properties:
   *           name:
   *               type: string
   *           locationId:
   *               type: string
   *           locationName:
   *               type: string
   *           staffId:
   *               type: string
   *           staffName:
   *               type: string
   *           processDescription:
   *               type: string
   *           prescriptionId:
   *               type: string
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           createOn:
   *               type: string
   *               format: date
   *           createdById:
   *               type: string
   *           createdByName:
   *               type: string
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
   *           detailTreatment:
   *                   type: string
   *
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
      const validateErrors = validate(req.body, createTreatmentProcessSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const location = await LocationModel.findOne({ where: { id: req.body.locationId } });
      if (!location) {
        throw new CustomError(
          locationErrorDetails.E_1000(`Location ${req.body.locationId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const staff = await StaffModel.findOne({ where: { id: req.body.staffId } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`Staff ${req.body.staffId} not found`));
      }
      const creator = await StaffModel.findOne({ where: { id: req.body.createdById } });
      if (!creator) {
        throw new CustomError(staffErrorDetails.E_4000(`Creator ${req.body.createdById} not found`));
      }
      const treatmentProcessData: any = { ...req.body };
      const procedureIds: any = [];
      for (const item of req.body.procedures) {
        await ProcedureModel.updateOne({ _id: item.id }, { status: item.status }).exec();
        procedureIds.push(item.id);
      }
      treatmentProcessData.procedureIds = procedureIds;
      const treatmentProcess = new TreatmentProcessModel(treatmentProcessData);
      await treatmentProcess.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * definitions:
   *   CreatePrescription:
   *       required:
   *           - treatmentProcessId
   *           - drugList
   *       properties:
   *           treatmentProcessId:
   *               type: string
   *           note:
   *               type: string
   *           createDate:
   *               type: string
   *               format: date
   *           drugList:
   *               type: array
   *               items:
   *                   type: object
   *                   properties:
   *                      medicineId:
   *                          type: string
   *                      quantity:
   *                          type: number
   *
   */

  /**
   * @swagger
   * /treatment/treatment-process/create-prescription:
   *   post:
   *     tags:
   *       - TreatmentProcess
   *     security:
   *       - Bearer: []
   *     name: createPrescription
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/CreatePrescription'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPrescription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createPrescriptionSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatment = await TreatmentModel.findById(req.body.treatmentId).exec();
      if (!treatment) {
        throw new CustomError(treatmentErrorDetails.E_3902(`Treatment ${req.body.treatmentId} not found`));
      }
      const prescriptionData = { ...req.body };
      const prescription = new PrescriptionModel(prescriptionData);
      await prescription.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(prescription));
    } catch (error) {
      return next(error);
    }
  };
}
