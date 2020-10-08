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
  LocationWorkingHourModel,
  StaffModel,
  CityModel,
  CompanyDetailModel,
  LocationImageModel,
  MarketPlaceFieldsModel,
  MarketPlaceValueModel,
} from '../../../repositories/postgres/models';

import {
  createLocationSchema,
  locationIdSchema,
  createLocationWorkingTimeSchema,
  updateLocationSchema
} from '../configs/validate-schemas';
import { FindOptions, Sequelize } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {normalizeRemoveAccent} from '../../../utils/text';
import { dataDefaultbyType, parseDatabyType } from '../utils';

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
   *       name: "description"
   *       type: string
   *     - in: "formData"
   *       name: "title"
   *       type: string
   *     - in: "formData"
   *       name: "payment"
   *       type: string
   *       enum:
   *          - cash
   *          - card
   *          - all
   *     - in: "formData"
   *       name: "parking"
   *       type: string
   *       enum:
   *          - active
   *          - inactive
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
    let transaction: any = null;
    try {
      let data: any = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        district: req.body.district,
        title: req.body.title,
        description: req.body.description,
        city: req.body.city,
        ward: req.body.ward,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        workingTimes: req.body.workingTimes,
        payment: req.body.payment,
        parking: req.body.parking,
        rating: req.body.rating,
        recoveryRooms: req.body.recoveryRooms,
        totalBookings: req.body.totalBookings,
        gender: req.body.gender,
        openedAt: req.body.openedAt
      };
      const validateErrors = validate(data, createLocationSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      data.companyId = res.locals.staffPayload.companyId;
      if (req.file) { data.photo = (req.file as any).location; }
      let company: any = await CompanyModel.findOne({
        where: { id: data.companyId },
        include: [
          {
            model: CompanyDetailModel,
            as: 'companyDetail',
            required: false,
            attributes: ['businessType', 'businessName']
          }
        ]
      });

      if (company) {
        company = {
          ...company.dataValues,
          ...company.companyDetail?.dataValues,
          ['companyDetail']: undefined
        };
      }

      const existLocation = LocationModel.findOne({
        where: {
          companyId: company.id
        }
      });
      let updateStaff = false;
      if (!existLocation) {
        updateStaff = true;
      }
      let city = await CityModel.findOne({
        where: {
          name: Sequelize.literal(`unaccent("CityModel"."name") ilike unaccent('%${data.city}%')`)
        },
        attributes: ['id', 'name']
      });
      if (!city) { // when can't find city then default city is 'Ho Chi Minh'
        city = await CityModel.findOne({
          where: {
            name: Sequelize.literal('unaccent("CityModel"."name") ilike unaccent(\'%Ho Chi Minh%\')')
          },
          attributes: ['id', 'name']
        });
      }

      const cityDetail: any = { cityId: city.id, city: city.name };
      data = {...data, ...cityDetail};
      // start transaction
      transaction = await sequelize.transaction();
      if (req.file) { data.photo = (req.file as any).location; }

      let pathName = '';
      if (data.address) {
        pathName = normalizeRemoveAccent(company.businessName) + '-' + normalizeRemoveAccent(data.address);
      } else {
        pathName = normalizeRemoveAccent(company.businessName) + '-' + uuidv4();
      }

      data = { ...data,  pathName };

      const location = await LocationModel.create(data, { transaction });

      // if (data.photo) {
      //   await LocationImageModel.bulkCreate(data.photo, { transaction: transaction });
      // }
      //const marketplaceValueData: any = [];

      const marketplaceFields: any = (
        await MarketPlaceFieldsModel.findAll({
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        })
      ).map((marketplaceField: any) => ({
        ...marketplaceField.dataValues
      }));

      await marketplaceFields.forEach(async (marketplaceField: any) => {
        const marketplaceValueData: any = {
          id: uuidv4(),
          locationId: location.id,
          fieldId: marketplaceField.id,
          value: data[marketplaceField.name] || dataDefaultbyType[marketplaceField.type]
        };
        await MarketPlaceValueModel.create(marketplaceValueData, { transaction });
      });

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

      if (updateStaff) {
        await StaffModel.update({ onboardStep: 1 }, { where: { id: company.ownerId }, transaction });
      }

      await transaction.commit();
      //commit transaction
      let newLocation: any = (await LocationModel.findOne({
        where: { id: location.id },
        include: [
          {
            model: MarketPlaceValueModel,
            as: 'marketplaceValues',
            required: false,
            attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: MarketPlaceFieldsModel,
                as: 'marketplaceField',
                required: false,
                attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] }
              }
            ]
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        group: [
         'LocationModel.id',
         'marketplaceValues.id',
         'marketplaceValues->marketplaceField.id'
        ]
      }));

      const locationDetail = newLocation.marketplaceValues?.reduce(
        (acc: any, { value, marketplaceField: { name, type }}: any) => {
          return  {
            ...acc,
            [name]: parseDatabyType[type](value)
          };
        },
        {}
      );

      newLocation = {
        ...newLocation.dataValues,
        ...locationDetail,
        marketplaceValues: undefined
      };

      return res.status(HttpStatus.OK).send(buildSuccessMessage(newLocation));
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
  // tslint:disable-next-line:variable-name
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
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
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
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
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
      if (!location) {
        return next(
          new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND)
        );
      }
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
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
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
      if (!rowsDeleted) {
        return next(
          new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND)
        );
      }
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
    let transaction = null;
    try {
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      const body = {
        locationId: req.body.locationId,
        workingTimes: req.body.workingTimes
      };
      const validateErrors = validate(body, createLocationWorkingTimeSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

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

      transaction = await sequelize.transaction();
      const locationWorkingHour = await LocationWorkingHourModel.bulkCreate(workingsTimes, { transaction });

      const company = await CompanyModel.findOne({ where: { id: companyId } });
      await StaffModel.update({ onboardStep: 2 }, { where: { id: company.ownerId }, transaction });
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locationWorkingHour));
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
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
      if (!location) {
        return next(
          new CustomError(
            locationErrorDetails.E_1000(`locationId ${params.locationId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      }

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
        longitude: body.longitude
      };

      if (file) {
        data.photo = (file as any).location;
      }
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
}
