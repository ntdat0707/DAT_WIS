import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { createQuotationsDentalSchema } from '../configs/validate-schemas';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';

export class QuotationsController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   treatmentCreate:
   *       properties:
   *           Date:
   *               type: string
   *               format: date
   *           Expire:
   *               type: string
   *               format: date
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           locationId:
   *               type: string
   *
   *           customerId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['planning', 'confirmed', 'completed']
   */
  /**
   * @swagger
   * /treatment/create-treatment:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createTreatment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/treatmentCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createQuotationsDental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
    } catch (error) {
      return next(error);
    }
  };


  /**
   * @swagger
   * definitions:
   *   quotationUpdate:
   *       properties:
   *           Date:
   *               type: string
   *               format: date
   *           Expire:
   *               type: string
   *               format: date
   *           treatmentId:
   *               type: string
   *           note:
   *               type: string
   *           locationId:
   *               type: string
   *
   *           customerId:
   *               type: string
   *           status:
   *               type: string
   *               enum: ['planning', 'confirmed', 'completed']
   */
  /**
   * @swagger
   * /treatment/quotations/update-quotations-dental:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createTreatment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/quotationUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateQuotationsDental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createQuotationsDentalSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
    } catch (error) {
      return next(error);
    }
  };
}
