import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../booking-service/controllers/base-controller';
import { TeethModel } from '../../../repositories/mongo/models/teeth-model';
import { ToothNotationModel } from '../../../repositories/mongo/models/tooth-notation-model';
import mongoose from 'mongoose';
import { DiagnosisModel } from '../../../repositories/mongo/models/diagnosis-model';
import { DiagnosticModel } from '../../../repositories/mongo/models/diagnostic-model';
import { DiagnosticPathModel } from '../../../repositories/mongo/models/diagnostic-path-model';
import { validate } from '../../../utils/validator';
import { createDiagnosis, deleteDiagnosis, updateDiagnosis } from '../configs/validate-schemas/diagnosis';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { TreatmentModel } from '../../../repositories/mongo/models';
import CustomError from '../../../utils/error-handlers/custom-error';
import { treatmentIdSchema } from '../configs/validate-schemas/treatment';
export class DiagnosticController extends BaseController {
  /**
   * @swagger
   * /treatment/diagnosis/get-all-diagnostic:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllDiagnostic
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllDiagnostic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnostic = await DiagnosticModel.find().exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnostic));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   ToothNotation:
   *       required:
   *           toothCode
   *           position
   *           toothName
   *           toothImage
   *       properties:
   *           toothName:
   *               type: string
   *           toothImage:
   *               type: string
   *           position:
   *               type: string
   *           toothCode:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   TeethInformation:
   *       required:
   *           toothNumber
   *           toothNotations
   *           type
   *       properties:
   *           toothNumber:
   *               type: string
   *           toothNotations:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/ToothNotation'
   *           type:
   *              type: string
   */
  /**
   * @swagger
   * /treatment/diagnosis/create-teeth:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createTeeth
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       type: string
   *       schema:
   *            $ref: '#/definitions/TeethInformation'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createTeeth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      const teethData: any = {
        type: dataInput.type,
        toothNumber: dataInput.toothNumber
      };
      const toothNotationIds: any = [];
      for (const tooth of dataInput.toothNotations) {
        tooth.teethId = teethData._id;
        const toothData = new ToothNotationModel(tooth);
        toothNotationIds.push(toothData._id);
        await toothData.save();
      }
      teethData.toothNotationIds = toothNotationIds;
      const teeth = new TeethModel(teethData);
      await teeth.save();

      //check find populate and sort
      const result3 = await TeethModel.findOne({ toothNumber: dataInput.toothNumber })
        .populate({ path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(result3));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/diagnosis/get-teeth/{teethId}:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getTeeth
   *     parameters:
   *     - in: path
   *       name: teethId
   *       required: true
   *       type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getTeeth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teethId = req.params.teethId;
      const teeth: any = await TeethModel.findOne({ _id: teethId })
        .populate({ path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(teeth));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateDiagnosticDetail:
   *       required:
   *           code
   *           name
   *           diagnosticSubs
   *           color
   *           colorText
   *       properties:
   *           code:
   *               type: string
   *           name:
   *               type: string
   *           diagnosticSubs:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateDiagnosticDetail'
   *           color:
   *               type: string
   *           colorText:
   *               type: string
   */
  /**
   * @swagger
   * /treatment/diagnosis/create-diagnostic:
   *   post:
   *     tags:
   *       - Treatment
   *     name: createDiagnostic
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       schema:
   *            $ref: '#/definitions/CreateDiagnosticDetail'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createDiagnostic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      const diagData: any = {
        _id: new mongoose.Types.ObjectId(),
        code: dataInput.code,
        name: dataInput.name,
        diagnosticSubs: []
      };
      const diag = new DiagnosticModel(diagData);
      diag.save();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateDiagnosis:
   *       required:
   *           teethNumber
   *           staffId
   *           diagnosticId
   *           diagnosticName
   *           treatmentId
   *       properties:
   *           teethNumber:
   *               type: string
   *           staffId:
   *               type: string
   *           diagnosticId:
   *               type: string
   *           diagnosticName:
   *               type: string
   *           treatmentId:
   *               type: string
   *
   */
  /**
   * @swagger
   * /treatment/diagnosis/create-diagnosis:
   *   post:
   *     tags:
   *       - Treatment
   *     name: createDiagnosis
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       schema:
   *            $ref: '#/definitions/CreateDiagnosis'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      const validateErrors = validate(dataInput, createDiagnosis);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const treatment = await TreatmentModel.findById({ _id: dataInput.treatmentId }).exec();
      if (!treatment) {
        throw new CustomError(
          treatmentErrorDetails.E_3902(`Treatment ${dataInput.treatmentId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const staff = await StaffModel.findOne({
        where: { id: dataInput.staffId },
        attributes: ['firstName'],
        raw: true
      });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`Staff ${dataInput.staffId} not found`), httpStatus.NOT_FOUND);
      }
      dataInput.staffName = staff.firstName;
      const teeth: any = await TeethModel.findOne({ toothNumber: dataInput.teethNumber }).exec();
      if (!teeth) {
        throw new CustomError(
          treatmentErrorDetails.E_3900(`Teeth ${dataInput.teethNumber} not found`),
          httpStatus.NOT_FOUND
        );
      }
      dataInput.teethId = teeth._id;
      if (treatment.diagnosisIds.length > 0) {
        for (const diagnosticId of treatment.diagnosisIds) {
          if (diagnosticId === dataInput.diagnosisId) {
            throw new CustomError(treatmentErrorDetails.E_3906(`Diagnostic ${diagnosticId} is already exists`));
          }
        }
      }
      const diagnosis: any = new DiagnosisModel(dataInput);
      await diagnosis.save();
      //update treatment
      treatment.diagnosisIds.push(diagnosis._id);
      await TreatmentModel.updateOne({ _id: dataInput.treatmentId }, treatment).exec();
      const diagnosticPath: any = await DiagnosticPathModel.find({ diagnosticId: dataInput.diagnosticId })
        .populate({
          path: 'pathologicalIds',
          model: 'ToothNotation',
          options: { sort: { position: 1 } }
        })
        .exec();
      diagnosis.diagnosticPath = diagnosticPath;
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosis));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/diagnosis/get-all-diagnosis/{treatmentId}:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllDiagnosis
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
  public getAllDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatmentId: any = req.params.treatmentId;
      const validateErrors = validate(treatmentId, treatmentIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let diagnosis: any = [];
      const treatment = await TreatmentModel.find({
        _id: treatmentId
      }).exec();
      if (!treatment) {
        throw new CustomError(treatmentErrorDetails.E_3902(`Treatment ${treatmentId} not found`), httpStatus.NOT_FOUND);
      }
      diagnosis = await DiagnosisModel.find({ treatmentId: treatmentId })
        // .populate({ path: 'diagnosticId', model: 'Diagnostic' })
        // .populate({
        //   path: 'teethId',
        //   model: 'Teeth',
        //   populate: { path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } }
        // })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosis));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateDiagnosis:
   *       properties:
   *           teethId:
   *               type: array
   *               items:
   *                   type: string
   *           staffId:
   *               type: string
   *           diagnosticId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['pending', 'confirmed', 'resolved']
   *           diagnosticName:
   *               type: string
   *           teethNumber:
   *               type: string
   *
   */
  /**
   * @swagger
   * /treatment/diagnosis/update-diagnosis/{diagnosisId}:
   *   put:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: updateDiagnosis
   *     parameters:
   *     - in: path
   *       name: diagnosisId
   *       type: string
   *     - in: "body"
   *       name: "body"
   *       $ref: '#/definitions/UpdateDiagnosis'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      dataInput.diagnosisId = req.params.diagnosisId;
      const validateErrors = validate(dataInput, updateDiagnosis);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const diagnosis: any = await DiagnosisModel.find({ _id: dataInput.diagnosisId }).exec();
      diagnosis.teethId = !dataInput.teethId ? diagnosis.teethId : dataInput.teethId;
      diagnosis.diagnosticId = !dataInput.diagnosticId ? diagnosis.diagnosticId : dataInput.diagnosticId;
      diagnosis.status = !dataInput.status ? diagnosis.status : dataInput.status;
      // diagnosis.diagnosticPathIds = !dataInput.diagnosticPathIds
      //   ? diagnosis.diagnosticPathIds
      //   : dataInput.diagnosticPathIds;
      diagnosis.diagnosticName = !dataInput.diagnosticName ? diagnosis.diagnosticName : dataInput.diagnosticName;
      if (dataInput.staffId) {
        diagnosis.staffId = !dataInput.staffId ? diagnosis.staffId : dataInput.staffId;
        const staff = await StaffModel.findOne({
          where: { id: dataInput.staffId },
          attributes: ['firstName'],
          raw: true
        });
        if (!staff) {
          throw new CustomError(staffErrorDetails.E_4000(`Staff ${dataInput.staffId} not found`), httpStatus.NOT_FOUND);
        }
        diagnosis.staffName = staff.firstName;
      }
      await DiagnosisModel.update({ _id: dataInput.diagnosisId }, diagnosis).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/diagnosis/delete-diagnosis/{diagnosisId}:
   *   delete:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: deleteDiagnosis
   *     parameters:
   *     - in: path
   *       name: diagnosisId
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
  public deleteDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnosisId = req.params.diagnosisId;
      const validateErrors = validate(diagnosisId, deleteDiagnosis);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const diagnosis = await DiagnosisModel.findById(diagnosisId).exec();
      if (!diagnosis) {
        throw new CustomError(treatmentErrorDetails.E_3908(`diagnosis ${diagnosisId} not found`), httpStatus.NOT_FOUND);
      }
      await DiagnosisModel.findByIdAndDelete(diagnosisId).exec();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   AddColor:
   *       properties:
   *           color:
   *               type: string
   *           colorText:
   *               type: string
   *
   */
  /**
   * @swagger
   * /treatment/diagnosis/add-color/{diagnosticId}:
   *   post:
   *     tags:
   *       - Treatment
   *     name: addColor
   *     parameters:
   *     - in: path
   *       name: diagnosticId
   *       type: string
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       schema:
   *            $ref: '#/definitions/AddColor'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public addColor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnosticId = req.params.diagnosticId;
      const dataInput = req.body;
      const diagnostic = await DiagnosticModel.findById({ _id: diagnosticId }).exec();
      if (!diagnostic) {
        throw new CustomError(
          treatmentErrorDetails.E_3907(`diagnostic ${diagnosticId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const diagPathData = {
        diagnosticId: diagnosticId,
        color: dataInput.color,
        colorText: dataInput.colorText
      };
      const diagPath = new DiagnosticPathModel(diagPathData);
      await diagPath.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagPath));
    } catch (error) {
      return next(error);
    }
  };
}
