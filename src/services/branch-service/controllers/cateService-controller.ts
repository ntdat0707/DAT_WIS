import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createCateServiceSchema } from '../configs/validate-schemas';
import { CateServiceModel } from '../../../repositories/postgres/models/cate-service';

export class CateServiceController {
  /**
   * @swagger
   * definitions:
   *   createCateService:
   *       required:
   *           - name
   *           - excerpt
   *       properties:
   *           name:
   *               type: string
   *           excerpt:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/cate-service/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createCateService
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/createCateService'
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
  public createCateService = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        name: body.name,
        excerpt: body.excerpt,
        companyId: res.locals.staffPayload.companyId,
      };
      const validateErrors = validate(data, createCateServiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      const cateService = await CateServiceModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateService));
    } catch (error) {
      return next(error);
    }
  };
}
