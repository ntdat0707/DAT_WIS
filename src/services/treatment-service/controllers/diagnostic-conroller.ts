import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { DiagnosticModel } from '../../../repositories/mongo/models';
import { TeethModel } from '../../../repositories/mongo/models/teeth-model';
import { ToothNotationModel } from '../../../repositories/mongo/models/tooth-notation-model';
import { DiagnosticDetailModel } from '../../../repositories/mongo/models/diagnostic-detail-model';
import mongoose from 'mongoose';

export class DiagnosticController extends BaseController {
  /**
   * @swagger
   * /treatment/diagnostic/get-all-diagnostic:
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
      const diagnostics = await DiagnosticModel.find().exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnostics));
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
   * /treatment/diagnostic/create-teeth:
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
        _id: new mongoose.Types.ObjectId(),
        type: dataInput.type,
        toothNumber: dataInput.toothNumber
      };
      const toothNotationsId: any = [];
      for (const tooth of dataInput.toothNotations) {
        tooth.teethId = teethData._id;
        const toothData = new ToothNotationModel(tooth);
        toothNotationsId.push(toothData._id);
        await toothData.save();
      }
      teethData.toothNotationsId = toothNotationsId;
      const teeth = new TeethModel(teethData);
      await teeth.save();
      //let result = await ToothNotationModel.find({ teethId: teethData._id }).populate('teeth').exec();
      const result2 = await TeethModel.find({ toothNotationsId: teethData.toothNotationsId })
        .populate('toothNotation')
        .exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(result2));
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
   *           pathologicalTeethIds
   *           diagnosticSubs
   *           color
   *           colorText
   *       properties:
   *           code:
   *               type: string
   *           name:
   *               type: string
   *           pathologicalTeethIds:
   *               type: array
   *               items:
   *                   type: string
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
   * /treatment/diagnostic/create-diagnostic-detail:
   *   post:
   *     tags:
   *       - Treatment
   *     name: createDiagnosticDetail
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
  public createDiagnosticDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      const diagData: any = {
        _id: new mongoose.Types.ObjectId(),
        code: dataInput.code,
        name: dataInput.name,
        color: dataInput.color,
        colorText: dataInput.colorText
      };
      if (dataInput.pathologicalTeethIds.length > 0) {
        const teethIds: any = [];
        for (const pathologicalTeethId of dataInput.pathologicalTeethIds) {
          const teethId = new mongoose.Types.ObjectId(pathologicalTeethId);
          teethIds.push(teethId);
        }
        diagData.pathologicalTeethIds = teethIds;
      }
      const diagnosticSubs: any = [];
      if (dataInput.diagnosticSubs.length > 0) {
        for (const diagnosticSubLevel1 of dataInput.diagnosticSubs) {
          const diagDataSubsLevel1: any = [];
          const diagDatalevel1: any = {
            _id: new mongoose.Types.ObjectId(),
            code: diagnosticSubLevel1.code,
            name: diagnosticSubLevel1.name,
            color: diagnosticSubLevel1.color,
            colorText: diagnosticSubLevel1.colorText
          };
          if (diagnosticSubLevel1.diagnosticSubs.length === 0) {
            const teethIds: any = [];
            for (const pathologicalTeethId of diagnosticSubLevel1.pathologicalTeethIds) {
              const teethId = new mongoose.Types.ObjectId(pathologicalTeethId);
              teethIds.push(teethId);
            }
            diagnosticSubLevel1.pathologicalTeethIds = teethIds;
            const newDiagnosticDetailData = {
              _id: new mongoose.Types.ObjectId(),
              code: diagnosticSubLevel1.code,
              name: diagnosticSubLevel1.name,
              pathologicalTeethIds: diagnosticSubLevel1.pathologicalTeethIds,
              color: diagnosticSubLevel1.color,
              colorText: diagnosticSubLevel1.colorText
            };
            const diagnosticDetail = new DiagnosticDetailModel(newDiagnosticDetailData);
            diagnosticSubs.push(diagnosticDetail);
          } else {
            const diagnosticDataSubsLevel1: any = [];
            for (const diagnosticSubLevel2 of diagnosticSubLevel1.diagnosticSubs) {
              if (diagnosticSubLevel2.diagnosticSubs.length === 0) {
                const teethIds: any = [];
                for (const pathologicalTeethId of diagnosticSubLevel2.pathologicalTeethIds) {
                  const teethId = new mongoose.Types.ObjectId(pathologicalTeethId);
                  teethIds.push(teethId);
                }
                diagnosticSubLevel2.pathologicalTeethIds = teethIds;
                const newDiagnosticDetail = {
                  _id: new mongoose.Types.ObjectId(),
                  code: diagnosticSubLevel2.code,
                  name: diagnosticSubLevel2.name,
                  pathologicalTeethIds: diagnosticSubLevel2.pathologicalTeethIds,
                  color: diagnosticSubLevel2.color,
                  colorText: diagnosticSubLevel2.colorText
                };
                const diagDetail = new DiagnosticDetailModel(newDiagnosticDetail);
                diagnosticDataSubsLevel1.push(diagDetail);
              }
            }
            diagDataSubsLevel1.push(diagnosticDataSubsLevel1);
            diagDatalevel1.diagnosticSubs = diagDataSubsLevel1;
          }
          diagnosticSubs.push(diagDatalevel1);
        }
        diagData.diagnosticSubs = diagnosticSubs;
        const diagDetailData = new DiagnosticDetailModel(diagData);
        await diagDetailData.save();
      } else {
        //create level 0
      }
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
