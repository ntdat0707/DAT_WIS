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
  StaffModel,
  LocationWorkingHourModel,
  CompanyModel,
  LocationDetailModel,
  CateServiceModel,
  ServiceModel
} from '../../../repositories/postgres/models';

import {
  createLocationSchema,
  locationIdSchema,
  createLocationWorkingTimeSchema,
  updateLocationSchema,
} from '../configs/validate-schemas';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import _ from 'lodash';
import moment from 'moment';

import uuid from 'uuid';
import { v4 as uuidv4 } from 'uuid';
export class LocationController {
  /**
   * @swagger
   * definitions:
   *   WorkingTimeDetail:
   *       required:
   *           - day
   *           - enabled
   *           - range
   *       properties:
   *           day:
   *               type: string
   *           enabled:
   *               type: boolean
   *           range:
   *               type: array
   *               items:
   *                   type: string
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
   *     - in: "formData"
   *       name: "title"
   *       type: string
   *     - in: "formData"
   *       name: "payment"
   *       type: string
   *       enum:
   *          - Cash
   *          - Card
   *          - All
   *     - in: "formData"
   *       name: "parking"
   *       type: string
   *       enum:
   *          - Active
   *          - Inactive
   *     - in: "formData"
   *       name: "rating"
   *       type: number 
   *     - in: "formData"
   *       name: "recoveryRooms"
   *       type: number
   *     - in: "formData"
   *       name: "totalBookings"
   *       type: number
   *     - in: "formData"
   *       name: "gender"
   *       type: number
   *     - in: "formData"
   *       name: "openedAt"
   *       type: string
   *       format: date-time
   *     - in: "formData"
   *       name: "workingTimes"
   *       type: array
   *       items:
   *           $ref: '#/definitions/WorkingTimeDetail'
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
      const data: any = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        city: req.body.city,
        district: req.body.district,
        ward: req.body.ward,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        // title: req.body.title,
        // payment: req.body.payment,
        // parking: req.body.parking,
        // openedAt: req.body.openedAt,
        workingTimes: req.body.workingTimes
      };

      const validateErrors = validate(data, createLocationSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      data.companyId = res.locals.staffPayload.companyId;
      if (req.file) {
        data.photo = (req.file as any).location;
      }
      const company = await CompanyModel.findOne({ where: { id: data.companyId } });
      // start transaction
      transaction = await sequelize.transaction();
      
      const location = await LocationModel.create(data, { transaction });
      
      let dataLocationDetail = [];
      dataLocationDetail.push({
        id: uuidv4(),
        title: req.body.title,
        payment: req.body.payment,
        parking: req.body.parking,
        rating: req.body.rating,
        recoveryRooms: req.body.recoveryRooms ,
        totalBookings:req.body.totalBookings,
        gender:req.body.gender,
        openedAt: req.body.openedAt,
      });

      await LocationDetailModel.bulkCreate(dataLocationDetail, { transaction });
      if (req.body.workingTimes && req.body.workingTimes.length > 0) {
        if (_.uniqBy(req.body.workingTimes, 'day').length !== req.body.workingTimes.length) {
          return next(
            new CustomError(locationErrorDetails.E_1002('Weekday do not allow duplicate value'), HttpStatus.BAD_REQUEST)
          );
        }
        const even = (element: any) => {
          return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
        };
        const checkValidWoringTime = await req.body.workingTimes.some(even);
        if (checkValidWoringTime) {
          return next(
            new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST)
          );
        }
        const workingsTimes = (req.body.workingTimes as []).map((value: any) => ({
          locationId: location.id,
          weekday: value.day,
          startTime: value.range[0],
          endTime: value.range[1],
          isEnabled: value.enabled
        }));
        await LocationWorkingHourModel.bulkCreate(workingsTimes, { transaction });
      }
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
      const locations = await LocationModel.findAll({
        where: { companyId },
        include: [
          {
            model: LocationWorkingHourModel,
            as: 'workingTimes',
            required: false
          }
        ]
      });
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
        },
        include: [
          {
            model: LocationWorkingHourModel,
            as: 'workingTimes',
            required: false
          }
        ]
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
          },
          {
            model: LocationWorkingHourModel,
            as: 'workingTimes',
            required: false
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

  /**
   * @swagger
   * definitions:
   *   WorkingTimeDetail:
   *       required:
   *           - day
   *           - enabled
   *           - range
   *       properties:
   *           day:
   *               type: string
   *           enabled:
   *               type: boolean
   *           range:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateLocationWorkingTime:
   *       required:
   *           - locationId
   *           - workingTimes
   *       properties:
   *           locationId:
   *               type: string
   *           workingTimes:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/WorkingTimeDetail'
   *
   */
  /**
   * @swagger
   * /branch/location/create-location-working-time:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createLocationWorkingTime
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateLocationWorkingTime'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       403:
   *         description: forbidden
   *       500:
   *         description: Server internal error
   */
  public createLocationWorkingTime = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const body = {
        locationId: req.body.locationId,
        workingTimes: req.body.workingTimes
      };
      const validateErrors = validate(body, createLocationWorkingTimeSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      if (_.uniqBy(body.workingTimes, 'day').length !== body.workingTimes.length) {
        return next(
          new CustomError(locationErrorDetails.E_1002('Weekday do not allow duplicate value'), HttpStatus.BAD_REQUEST)
        );
      }
      if (!(workingLocationIds as string[]).includes(body.locationId)) {
        return next(
          new CustomError(
            locationErrorDetails.E_1001(`Can not access to this ${body.locationId}`),
            HttpStatus.BAD_REQUEST
          )
        );
      }
      const even = (element: any) => {
        return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
      };
      const checkValidWoringTime = await body.workingTimes.some(even);
      if (checkValidWoringTime) {
        return next(
          new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST)
        );
      }

      const existLocationWorkingHour = await LocationWorkingHourModel.findOne({
        where: {
          locationId: body.locationId
        }
      });
      if (existLocationWorkingHour) {
        return next(
          new CustomError(
            locationErrorDetails.E_1003(`Location ${body.locationId} working hours is exist`),
            HttpStatus.BAD_REQUEST
          )
        );
      }

      const workingsTimes = (body.workingTimes as []).map((value: any) => ({
        locationId: body.locationId,
        weekday: value.day,
        startTime: value.range[0],
        endTime: value.range[1],
        isEnabled: value.enabled
      }));
      const locationWorkingHour = await LocationWorkingHourModel.bulkCreate(workingsTimes);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locationWorkingHour));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   WorkingTimeDetail:
   *       required:
   *           - day
   *           - enabled
   *           - range
   *       properties:
   *           day:
   *               type: string
   *           enabled:
   *               type: boolean
   *           range:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * /branch/location/update-location/{locationId}:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: updateLocation
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *       required: true
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: "name"
   *       type: string
   *     - in: "formData"
   *       name: "phone"
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
   *     - in: "formData"
   *       name: "status"
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: "title"
   *       type: string
   *     - in: "formData"
   *       name: "payment"
   *       type: string
   *       enum:
   *          - Cash
   *          - Card
   *     - in: "formData"
   *       name: "parking"
   *       type: string
   *       enum:
   *          - Active
   *          - Inactive
   *     - in: "formData"
   *       name: "recoveryRooms"
   *       type: number
   *     - in: "formData"
   *       name: "workingTimes"
   *       type: array
   *       items:
   *           $ref: '#/definitions/WorkingTimeDetail'
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
  public updateLocation = async ({ params, body, file }: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      let validateErrors: any;
      validateErrors = validate(params.locationId, locationIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      validateErrors = validate(body, updateLocationSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const location = await LocationModel.findOne({
        where: {
          id: params.locationId,
          companyId: companyId
        }
      });
      if (!location)
        return next(
          new CustomError(
            locationErrorDetails.E_1000(`locationId ${params.locationId} not found`),
            HttpStatus.NOT_FOUND
          )
        );

      // start transaction
      transaction = await sequelize.transaction();
      if (body.workingTimes && body.workingTimes.length > 0) {
        if (_.uniqBy(body.workingTimes, 'day').length !== body.workingTimes.length) {
          return next(
            new CustomError(locationErrorDetails.E_1002('Weekday do not allow duplicate value'), HttpStatus.BAD_REQUEST)
          );
        }
        if (!(workingLocationIds as string[]).includes(params.locationId)) {
          return next(
            new CustomError(
              locationErrorDetails.E_1001(`Can not access to this ${params.locationId}`),
              HttpStatus.BAD_REQUEST
            )
          );
        }
        const even = (element: any) => {
          return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
        };
        const checkValidWoringTime = await body.workingTimes.some(even);
        if (checkValidWoringTime) {
          return next(
            new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST)
          );
        }
        const existLocationWorkingHour = await LocationWorkingHourModel.findOne({
          where: {
            locationId: params.locationId
          }
        });
        const workingsTimes = (body.workingTimes as []).map((value: any) => ({
          locationId: params.locationId,
          weekday: value.day,
          startTime: value.range[0],
          endTime: value.range[1],
          isEnabled: value.enabled
        }));
        if (existLocationWorkingHour) {
          await LocationWorkingHourModel.destroy({ where: { locationId: params.locationId }, transaction });
          await LocationWorkingHourModel.bulkCreate(workingsTimes, { transaction });
        } else {
          await LocationWorkingHourModel.bulkCreate(workingsTimes, { transaction });
        }
      }
      const data: any = {
        name: body.name ? body.name : location.name,
        phone: body.phone ? body.phone : location.phone,
        email: body.email,
        city: body.city,
        district: body.district,
        ward: body.ward,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        title: body.title,
        payment: body.payment,
        parking: body.parking,
        recoveryRooms: body.recoveryRooms
      };
      if (file) data.photo = (file as any).location;
      await LocationModel.update(data, { where: { id: params.locationId }, transaction });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
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
   * /branch/location/search-by-city:
   *   get:
   *     tags:
   *       - Branch
   *     name: searchLocationsByCity
   *     parameters:
   *     - in: query
   *       name: cityName
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public searchLocationsByCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cityName = req.query.cityName;
      const locations = await LocationModel.findAll({
        where: {
          city: { [Op.like]: '%' + cityName + '%' }
        },
        order: [['city', 'ASC']]
      });
      if (!locations)
        return next(new CustomError(locationErrorDetails.E_1000(`City ${cityName} not found`), HttpStatus.NOT_FOUND));
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/get-location-detail/{locationId}:
   *   get:
   *     tags:
   *       - Branch
   *     name: getLocationDetail
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getLocationDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locationId = req.params.locationId;
      const validateErrors = validate(locationId, locationIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const location: any = await LocationModel.findOne({
        where: {
          id: locationId
        }
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

  calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km 
    const toRad = (value: number) => (value * Math.PI) / 180; // Converts numeric degrees to radians 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  /**
   * @swagger
   * /branch/location/filter-newest-locations:
   *   get:
   *     tags:
   *       - Branch
   *     name: filterNewestLocations
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
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public filterNewestLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      const locations = await LocationModel.findAll({
        order: [['openedAt', 'DESC']]
      });

      const locationsPaginate = await paginate(
        LocationModel,
        locations,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );

      return res.status(HttpStatus.OK).send(buildSuccessMessage(locationsPaginate));
    } catch (err) {
      return next(err);
    }
  };

  /**
   * @swagger
   * /branch/location/get-location-by-service-provider:
   *   post:
   *     tags:
   *       - Branch
   *     name: getLocationByServiceProvider
   *     parameters:
   *     - in: query
   *       name: keyword
   *       schema:
   *          type: integer
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
   *     - in: query
   *       name: latitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: longitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: order
   *       schema: 
   *          type: string
   *          enum: [ nearest, newest ]
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public getLocationByServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // let locations: any[] = [];
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const keywords: string = req.query.keyword as string;
      let keywordsQuery = keywords
        .split(' ')
        .filter((x: string) => x)
        .map((keyword: string) => `unaccent('%${keyword}%')`) 
        .join(',');

      if (!keywordsQuery) {
        keywordsQuery = '\'%%\'';
      } 
      let locationResults: any = (await LocationModel.findAll({
        include: [
          {
            model: CompanyModel,
            as: 'company',
            attributes: [],
            required: true,
            include: [
              {
                model: CateServiceModel,
                as: 'cateServices',
                attributes: [],
                required: true,
                include: [
                  {
                    model: ServiceModel,
                    as: 'services',
                    required: true,
                    attributes: []
                  }
                ]
              }
            ]
          }
        ],
        where: {
          [Op.or]: [
            Sequelize.literal(`unaccent("LocationModel"."name") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("LocationModel"."address") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("LocationModel"."ward") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("LocationModel"."district") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company->cateServices"."name") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company->cateServices->services"."name") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company"."business_type") ilike ANY(ARRAY[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company"."business_name") ilike ANY(ARRAY[${keywordsQuery}])`)
          ]
        },
        group: ['LocationModel.id']
      }));

      if (
        req.query.latitude
        && req.query.longtitude
        && !Number.isNaN(+(req.query.latitude))
        && !Number.isNaN(+(req.query.longitude))
      ) {
        const latitude: number = +req.query.latitude;
        const longitude: number = +req.query.longitude;
        locationResults = locationResults.map((location:any) => ({
          ...location,
          distance: this.calcCrow(latitude, longitude, location.latitude, location.longitude)
        })).sort((locationX: any, locationY: any) => {
          return locationX.distance - locationY.distance; 
        });
      }
      // const locations = await LocationModel.findAll({...query});
      const locationIds = locationResults.map((item:any) => item.id);

      const query: FindOptions = {
        where: {
          id: {
            [Op.in]: locationIds 
          }
        }
      };

      // console.log('LOCATIONS', (await LocationModel.findAll({})).length);

      if (!!locationIds.length) {
        query.order = Sequelize.literal(`(${
          locationIds
            .map((id: any) => (`"id" = \'${id}\'`))
            .join(', ')
        }) DESC`); 
      }

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
}
