import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../booking-service/controllers/base-controller';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  createMedicalDocumentFileSchema,
  medicalDocumentIdSchema,
  medicalFileIDSchema
} from '../configs/validate-schemas/medical-document';
import { MedicalDocumentModel } from '../../../repositories/mongo/models/medical-document-model';
import { MedicalFileModel } from '../../../repositories/mongo/models/medical-file-model';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { treatmentIdSchema } from '../configs/validate-schemas';

export class MedicalDocumentController extends BaseController {
  /**
   * @swagger
   * /treatment/medical-document/create-file:
   *   post:
   *     tags:
   *       - Medical Document
   *     security:
   *       - Bearer: []
   *     name: createMedicalDocumentFile
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       required: true
   *     - in: "formData"
   *       name: "name"
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: "medicalDocumentId"
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
  public createMedicalDocumentFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput: any = req.body;
      const validateErrors = validate(dataInput, createMedicalDocumentFileSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const medicalDocument: any = await MedicalDocumentModel.findById(dataInput.medicalDocumentId).exec();
      if (!medicalDocument) {
        throw new CustomError(
          treatmentErrorDetails.E_4100(`Medical Document ${dataInput.medicalDocumentId} not found`)
        );
      }
      if (req.file) dataInput.path = (req.file as any).location;
      const medicalFile = new MedicalFileModel(dataInput);
      await medicalFile.save();
      medicalDocument.medicalFileIds.push(medicalFile._id);
      await MedicalDocumentModel.updateOne({ _id: dataInput.medicalDocumentId }, medicalDocument).exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(medicalFile));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/medical-document/get-all-medical-document/{treatmentId}:
   *   get:
   *     tags:
   *       - Medical Document
   *     security:
   *       - Bearer: []
   *     name: getAllMedicalDocument
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
  public getAllMedicalDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentId = req.params.treatmentId;
      const validateErrors = validate(treatmentId, treatmentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const medicalDocument: any = await MedicalDocumentModel.find({ treatmentId: treatmentId }).exec();
      if (!medicalDocument) {
        throw new CustomError(treatmentErrorDetails.E_3902(`Treatment ${treatmentId} not found`));
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(medicalDocument));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/medical-document/get-medical-document/{medicalDocumentId}:
   *   get:
   *     tags:
   *       - Medical Document
   *     security:
   *       - Bearer: []
   *     name: getMedicalDocument
   *     parameters:
   *     - in: path
   *       name: medicalDocumentId
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
  public getMedicalDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicalDocumentId = req.params.medicalDocumentId;
      const validateErrors = validate(medicalDocumentId, medicalDocumentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const medicalDocument: any = await MedicalDocumentModel.findById({ _id: medicalDocumentId }).exec();
      if (!medicalDocument) {
        throw new CustomError(treatmentErrorDetails.E_4100(`Medical Document ${medicalDocumentId} not found`));
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(medicalDocument));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/medical-document/delete-file/{medicalFileId}:
   *   delete:
   *     tags:
   *       - Medical Document
   *     security:
   *       - Bearer: []
   *     name: deleteMedicalFile
   *     parameters:
   *     - in: path
   *       name: medicalFileId
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
  public deleteMedicalFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicalFileId = req.params.medicalFileId;
      const validateErrors = validate(medicalFileId, medicalFileIDSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const medicalFile: any = await MedicalFileModel.findById(medicalFileId).exec();
      if (!medicalFile) {
        throw new CustomError(treatmentErrorDetails.E_4100(`Medical file ${medicalFileId} not found`));
      }
      await MedicalFileModel.deleteOne({ _id: medicalFileId }).exec();
      const medicalDocument = await MedicalDocumentModel.findById(medicalFile.medicalDocumentId).exec();
      const index = medicalDocument.medicalFileIds.indexOf(medicalFileId, 0);
      if (index > -1) {
        medicalDocument.medicalFileIds.splice(index, 1);
      }
      await MedicalDocumentModel.updateOne({ _id: medicalFile.medicalDocumentId }, medicalDocument).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
