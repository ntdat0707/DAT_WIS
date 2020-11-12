import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';

export class TreatmentController extends BaseController {
  /**
   * @swagger
   * /treatment/get-all-medical-history:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllMedicalHistory
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const medicalHistory = await MedicalHistoryModel.findAll();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
