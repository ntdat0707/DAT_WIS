import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
// import { FindOptions } from 'sequelize';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { sequelize, LocationModel, LocationStaffModel, CompanyModel } from '../../../repositories/postgres/models';

import { createLocationSchema } from '../configs/validate-schemas';

export class LocationController {
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
  public createLocation = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      // start transaction
      transaction = await sequelize.transaction();
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
      data.companyId = res.locals.staffPayload.companyId;
      const company = await CompanyModel.findOne({ where: { id: data.companyId } });
      const location = await LocationModel.create(data, { transaction });
      await LocationStaffModel.create({ staffId: company.ownerId, locationId: location.id }, { transaction });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(location));
    } catch (error) {
      //rollback transaction
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/get-all-locations:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getAllLocations
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal error
   */
  public getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const locations = await LocationModel.findAll({ where: { companyId } });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };
}
