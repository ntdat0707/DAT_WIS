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
import { createDiagnosis, getDiagnosis, updateDiagnosis } from '../configs/validate-schemas/diagnosis';
import CustomError from '../../../utils/error-handlers/custom-error';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
import { customerErrorDetails, treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { CustomerWisereModel } from '../../../repositories/postgres/models/customer-wisere-model';
import { TreatmentModel } from '../../../repositories/mongo/models';
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
   *           order
   *           toothName
   *           toothImage
   *       properties:
   *           toothName:
   *               type: string
   *           toothImage:
   *               type: string
   *           order:
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
   *           status:
   *               type: string
   *               enum: ['pending', 'confirmed', 'resolved']
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
        throw new CustomError(treatmentErrorDetails.E_3902(`Treatment ${dataInput.treatmentId} not found`));
      }
      const staff = await StaffModel.findOne({
        where: { id: dataInput.staffId },
        attributes: ['firstName'],
        raw: true
      });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`Staff ${dataInput.staffId} not found`));
      }
      dataInput.staffName = staff.firstName;

      //get teeth Number

      //check diagnostic is only one

      const diagnosis: any = new DiagnosisModel(dataInput);
      await diagnosis.save();
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
   * /treatment/diagnosis/get-all-diagnosis:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllDiagnosis
   *     parameters:
   *     - in: query
   *       name: customerId
   *       type: string
   *       required: true
   *     - in: query
   *       name: treatmentId
   *       type: string
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
      const dataInput: any = req.query;
      const validateErrors = validate(dataInput, getDiagnosis);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const customer = await CustomerWisereModel.findAll({ where: { id: dataInput.customerId } });
      if (!customer) {
        throw new CustomError(customerErrorDetails.E_3001(`Customer ${dataInput.customerId} not found`));
      }
      let diagnosis: any = [];
      if (dataInput.treatmentId) {
        const treatment = await TreatmentModel.find({
          _id: dataInput.treatmentId,
          customerId: dataInput.customerId
        }).exec();
        if (!treatment) {
          throw new CustomError(treatmentErrorDetails.E_3902(`Treatment ${dataInput.treatmentId} not found`));
        }
        diagnosis = await DiagnosisModel.find({ treatmentId: dataInput.treatmentId })
          .populate({ path: 'diagnosticId', model: 'Diagnostic' })
          .populate({
            path: 'teethId',
            model: 'Teeth',
            populate: { path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } }
          })
          .exec();
      } else {
        const treatment = await TreatmentModel.find({ customerId: dataInput.customerId }).exec();
        if (!treatment) {
          throw new CustomError(
            treatmentErrorDetails.E_3902(`Treatment with Customer ${dataInput.customerId} not found`)
          );
        }
        diagnosis = await DiagnosisModel.find()
          .populate({ path: 'diagnosticId', model: 'Diagnostic' })
          .populate({
            path: 'teethId',
            model: 'Teeth',
            populate: { path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } }
          })
          .exec();
      }
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
          throw new CustomError(staffErrorDetails.E_4000(`Staff ${dataInput.staffId} not found`));
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
        throw new CustomError(treatmentErrorDetails.E_3903(`diagnostic ${diagnosticId} not found`));
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
