import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../booking-service/controllers/base-controller';
import { TeethModel } from '../../../repositories/mongo/models/teeth-model';
import { ToothNotationModel } from '../../../repositories/mongo/models/tooth-notation-model';
import mongoose from 'mongoose';
import { DiagnosisModel } from '../../../repositories/mongo/models/diagnosis-model';
import { DiagnosticModel } from '../../../repositories/mongo/models/diagnostic-model';
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
  public getAllDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnosis = await DiagnosisModel.find().exec();

      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosis));
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
        .populate({ path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: -1 } } })
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
        .populate({ path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: -1 } } })
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
   *   CreateDiagnostic:
   *       required:
   *           teethNumber
   *           teethId
   *           staffId
   *           diagnosticDetailId
   *           status
   *       properties:
   *           teethNumber:
   *               type: number
   *           teethId:
   *               type: string
   *           staffId:
   *               type: string
   *           diagnosticDetailId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['pending', 'confirmed', 'resolved']
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
   *            $ref: '#/definitions/CreateDiagnostic'
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
      const diagnostics = new DiagnosisModel(dataInput);
      await diagnostics.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnostics));
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
          populate: { path: 'toothNotationIds', model: 'ToothNotation', options: { sort: { position: -1 } } }
        })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosis));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/diagnosis/get-diagnostics:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getDiagnostics
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getDiagnostics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagnostic = await DiagnosticModel.find()
        .populate({ path: 'pathologicalIds', model: 'ToothNotation', options: { sort: { position: -1 } } })
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnostic));
    } catch (error) {
      return next(error);
    }
  };
}
