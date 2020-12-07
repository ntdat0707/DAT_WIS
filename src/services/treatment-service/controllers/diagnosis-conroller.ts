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
import { createDiagnosis } from '../configs/validate-schemas/diagnosis';
import CustomError from '../../../utils/error-handlers/custom-error';
import { StaffModel } from '../../../repositories/postgres/models/staff-model';
import { staffErrorDetails } from '../../../utils/response-messages/error-details/staff';
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
   *           teethId
   *           teethNumber
   *           staffId
   *           diagnosticIds
   *           diagnosticPathIds
   *           diagnosticName
   *       properties:
   *           teethId:
   *               type: string
   *           teethNumber:
   *               type: string
   *           staffId:
   *               type: string
   *           diagnosticIds:
   *               type: array
   *               items:
   *                   type: string
   *           status:
   *               type: string
   *               enum: ['pending', 'confirmed', 'resolved']
   *           diagnosticName:
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
      const diagnosticPath: any = await DiagnosticPathModel.find({ diagnosticId: dataInput.diagnosticIds })
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
   * /treatment/diagnosis/get-diagnosis:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getDiagnosis
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnosis = await DiagnosisModel.find()
        .populate({ path: 'diagnosticId', model: 'Diagnostic' })
        .populate({
          path: 'teethId',
          model: 'Teeth',
          populate: { path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: 1 } } }
        })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosis));
    } catch (error) {
      return next(error);
    }
  };
}
