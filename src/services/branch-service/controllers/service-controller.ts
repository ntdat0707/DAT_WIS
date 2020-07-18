import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
// import { FindOptions } from 'sequelize';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { LocationModel } from '../../../repositories/postresql/models';

import { createLocationSchema } from '../configs/validate-schemas';

export class ServiceController {
  constructor() {}

  /**
   * @swagger
   * definitions:
   *   CreateLocation:
   *       required:
   *           - name
   *           - phone
   *           - status
   *       properties:
   *           name:
   *               type: string
   *           status:
   *               type: string
   *               enum: [active, inactive]
   *           phone:
   *               type: string
   *           email:
   *               type: string
   *           city:
   *               type: string
   *           district:
   *               type: string
   *           ward:
   *               type: string
   *           address:
   *               type: string
   *           latitude:
   *               type: number
   *           longitude:
   *               type: number
   *
   *
   */

  /**
   * @swagger
   * /branch/location/create-location:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createLocation
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateLocation'
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
  public createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        name: req.body.name,
        phone: req.body.phone,
        status: req.body.status,
        email: req.body.email,
        city: req.body.city,
        district: req.body.district,
        ward: req.body.ward,
        latitude: req.body.latitude,
        longitude: req.body.longitude
      };
      const validateErrors = validate(data, createLocationSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      data.companyId = req.body.staffPayload.companyId;
      const location = await LocationModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(location));
    } catch (error) {
      return next(error);
    }
  };
}
