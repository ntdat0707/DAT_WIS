import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createServiceSchema } from '../configs/validate-schemas';
import { ServiceModel } from '../../../repositories/postgres/models/service';

export class ServiceController {
  constructor() {}
  /**
   * @swagger
   * definitions:
   *   createService:
   *       required:
   *           - locationId
   *           - description
   *           - salePrice
   *           - color
   *           - duration
   *           - cateServiceId
   *       properties:
   *           locationId:
   *               type: string
   *           description:
   *               type: string
   *           cateServiceId:
   *               type: string
   *           salePrice:
   *               type: integer
   *           duration:
   *               type: integer
   *           color:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/service/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createService
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/createService'
   *     responses:
   *       200:
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public createService = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(body, createServiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const data: any = {
        locationId: body.locationId,
        description: body.description,
        salePrice: body.salePrice,
        duration: body.duration,
        color: body.color,
        status: 1,
        cateServiceId: body.cateServiceId
      };
      const service = await ServiceModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(service));
    } catch (error) {
      return next(error);
    }
  };
}
