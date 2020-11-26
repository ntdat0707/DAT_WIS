import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { TreatmentProcessModel, ProcedureModel, PrescriptionModel } from '../../../repositories/mongo/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createTreatmentProcessSchema } from '../configs/validate-schemas/treatment-process';
import { LocationModel } from '../../../repositories/postgres/models/location';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';

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
   *           prescription:
   *                   type: object
   *                   properties:
   *                        treatmentProcessId:
   *                            type: string
   *                        note:
   *                            type: string
   *                        createDate:
   *                            type: string
   *                            format: date
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
      const dataInput = req.body;
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
      const staff = await StaffModel.findOne({ where: { id: dataInput.staffId } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`Staff ${dataInput.staffId} not found`));
      }
      const creator = await StaffModel.findOne({ where: { id: dataInput.createdById } });
      if (!creator) {
        throw new CustomError(staffErrorDetails.E_4000(`Creator ${dataInput.createdById} not found`));
      }
      const treatmentProcessData: any = { ...dataInput };
      const procedureIds: any = [];
      for (const item of req.body.procedures) {
        await ProcedureModel.updateOne({ _id: item.id }, { status: item.status }).exec();
        procedureIds.push(item.id);
      }
      treatmentProcessData.procedureIds = procedureIds;
      if (dataInput.prescription) {
        const prescriptionData = { ...dataInput.prescription };
        const prescription: any = new PrescriptionModel(prescriptionData);
        treatmentProcessData.prescriptionId = prescription._id;
        await prescription.save();
      }
      const treatmentProcess = new TreatmentProcessModel(treatmentProcessData);
      await treatmentProcess.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatmentProcess));
    } catch (error) {
      return next(error);
    }
  };
}
