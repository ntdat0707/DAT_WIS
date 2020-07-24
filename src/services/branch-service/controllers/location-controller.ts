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
   * /branch/location/create-location:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createLocation
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: "name"
   *       required: true
   *       type: string
   *     - in: "formData"
   *       name: "status"
   *       required: true
   *       type: string
   *       enum: [active, inactive]
   *     - in: "formData"
   *       name: "phone"
   *       required: true
   *       type: string
   *     - in: "formData"
   *       name: "email"
   *       type: string
   *     - in: "formData"
   *       name: "city"
   *       type: string
   *     - in: "formData"
   *       name: "district"
   *       type: string
   *     - in: "formData"
   *       name: "ward"
   *       type: string
   *     - in: "formData"
   *       name: "latitude"
   *       type: number
   *     - in: "formData"
   *       name: "longitude"
   *       type: number
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
      if (req.file) data.photo = (req.file as any).location;
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
   *         description: Server internal errors
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
