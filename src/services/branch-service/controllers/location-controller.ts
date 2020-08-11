import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  LocationModel,
  LocationStaffModel,
  CompanyModel,
  StaffModel
} from '../../../repositories/postgres/models';

import { createLocationSchema, locationIdSchema } from '../configs/validate-schemas';
import { FindOptions } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';

export class LocationController {
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
   *       name: "address"
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
        email: req.body.email,
        city: req.body.city,
        district: req.body.district,
        ward: req.body.ward,
        address: req.body.address,
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
      if (transaction) {
        await transaction.rollback();
      }
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
  public getAllLocations = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const locations = await LocationModel.findAll({ where: { companyId } });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/get-locations:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getLocations
   *     parameters:
   *     - in: query
   *       name: pageNum
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageSize
   *       required: true
   *       schema:
   *          type: integer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const companyId = res.locals.staffPayload.companyId;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        where: {
          companyId: companyId
        }
      };
      const locations = await paginate(
        LocationModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/get-location/{locationId}:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getLocation
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const locationId = req.params.locationId;
      const validateErrors = validate(locationId, locationIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const location: any = await LocationModel.findOne({
        where: {
          id: locationId,
          companyId: companyId
        },
        include: [
          {
            model: CompanyModel,
            as: 'company',
            required: true,
            include: [
              {
                model: StaffModel.scope('safe'),
                as: 'owner',
                required: true
              }
            ]
          }
        ]
      });
      if (!location)
        return next(
          new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND)
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(location));
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * /branch/location/delete/{locationId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getLocation
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const locationId = req.params.locationId;
      const validateErrors = validate(locationId, locationIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      if (!(workingLocationIds as string[]).includes(locationId)) {
        return next(
          new CustomError(locationErrorDetails.E_1001(`Can not access to this ${locationId}`), HttpStatus.NOT_FOUND)
        );
      }
      const rowsDeleted: any = await LocationModel.destroy({
        where: {
          id: locationId
        }
      });
      if (!rowsDeleted)
        return next(
          new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND)
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(rowsDeleted));
    } catch (error) {
      return next(error);
    }
  };
}
