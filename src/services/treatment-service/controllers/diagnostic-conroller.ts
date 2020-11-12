import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { DiagnosticModel } from '../../../repositories/mongo/models';

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
   *           toothName
   *           toothImage
   *       properties:
   *           toothName:
   *               type: string
   *           toothImage:
   *               type: string
   *
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
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "toothNumber"
   *       required: true
   *       type: string
   *     - in: "formData"
   *       name: "type"
   *       required: true
   *       type: string
   *       enum: ['adult','kid']
   *     - in: "formData"
   *       name: "toothNotations"
   *       required: true
   *       type: array
   *       items:
   *            $ref: '#/definitions/ToothNotation'
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
      const diagnostics = await DiagnosticModel.find().exec();
      return res.status(httpStatus.OK).send(buildSuccessMessage(diagnostics));
    } catch (error) {
      return next(error);
    }
  };
}
