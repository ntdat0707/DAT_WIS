import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { DiagnosticModel } from '../../../repositories/mongo/models';
import { TeethModel } from '../../../repositories/mongo/models/teeth-model';
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
   *           code
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
   *           code:
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
      const teethData = new TeethModel(dataInput);
      await teethData.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(teethData));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   ToothNotation:
   *       required:
   *           code
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
   *           code:
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
   * definitions:
   *   CreateDiagnosticDetail:
   *       required:
   *           code
   *           name
   *           pathologicalImages
   *           diagnosticSub
   *       properties:
   *           code:
   *               type: string
   *           name:
   *               type: string
   *           pathologicalImages:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/ToothNotation'
   *           diagnosticSub:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateDiagnosticDetail'
   */
  /**
   * @swagger
   * definitions:
   *   CreateDiagnostic:
   *       required:
   *           staffId
   *           customerId
   *           type
   *           teeth
   *           diagnostics
   *       properties:
   *           staffId:
   *               type: string
   *           customerId:
   *               type: string
   *           type:
   *               type: string
   *               enum: ['adult','kid']
   *           teeth:
   *               type: object
   *               schema:
   *                   $ref: '#/definitions/TeethInformation'
   *           diagnostics:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateDiagnosticDetail'
   *
   */
  /**
   * @swagger
   * /treatment/diagnostic/create-diagnostic:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createDiagnostic
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
  public createDiagnostic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.body;
      // const validateErrors = validate(dataInput, createDiagnostic);
      // if (validateErrors) {
      //   throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      // }

      // for (let diagSub1 of dataInput.diagnosticsSub) {
      //   if (diagSub1.pathologicalImages.length > 0) {
      //     //   let diagData = [...diag];
      //   }
      // }
      const diagnosticsData = new DiagnosticModel(dataInput);
      await diagnosticsData.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnosticsData));
    } catch (error) {
      return next(error);
    }
  };
}
