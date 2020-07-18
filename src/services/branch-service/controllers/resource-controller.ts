import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createResourceSchema } from '../configs/validate-schemas/resource';
import { ResourceModel } from '../../../repositories/postresql/models/resource';

export class ResourceController {
  constructor() {}

  /**
   * @swagger
   * definitions:
   *   CreateResource:
   *       required:
   *           - locationId
   *           - description
   *       properties:
   *           locationId:
   *               type: string
   *           description:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/resource/create-resource:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createResource
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateResource'
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
  public createResource = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      console.log(res.locals.staffPayload);
      const data: any = {
        locationId: body.locationId,
        description: body.description
      };
      const validateErrors = validate(data, createResourceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const location = await ResourceModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(location));
    } catch (error) {
      return next(error);
    }
  };
}
