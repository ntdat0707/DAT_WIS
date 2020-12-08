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
  CompanyDetailModel,
  CompanyTypeDetailModel,
  LocationImageModel
} from '../../../repositories/postgres/models';

import {
  createLocationSchema,
  locationIdSchema,
  createLocationWorkingTimeSchema,
  updateLocationSchema
} from '../configs/validate-schemas';
import { FindOptions } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { normalizeRemoveAccent } from '../../../utils/text';

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
   *       type: array
   *       items:
   *          type: file
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
   *       name: "address"
   *       type: string
   *     - in: "formData"
   *       name: "fullAddress"
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
   *       name: "openedAt"
   *       type: string
   *       format: date-time
   *     - in: "formData"
   *       name: "placeId"
   *       type: string
   *     - in: "formData"
   *       name: "workingTimes"
   *       type: array
   *       items:
   *           $ref: '#/definitions/WorkingTimeDetail'
   *     - in: "formData"
   *       name: "addressInfor"
   *       type: array
   *       items:
   *           type: object
   *     - in: "formData"
   *       name: "prefixCode"
   *       type: string
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
        title: req.body.title,
        description: req.body.description,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        workingTimes: req.body.workingTimes,
        payment: req.body.payment,
        parking: req.body.parking,
        rating: req.body.rating,
        recoveryRooms: req.body.recoveryRooms,
        totalBookings: req.body.totalBookings,
        openedAt: req.body.openedAt,
        placeId: req.body.placeId,
        addressInfor: req.body.addressInfor,
        fullAddress: req.body.fullAddress,
        prefixCode: req.body.prefixCode
      };
      const validateErrors = validate(data, createLocationSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      for (let i = 0; i < data.addressInfor.length; i++) {
        switch (data.addressInfor[i].types[0]) {
          case 'route':
            data.street = data.addressInfor[i].long_name;
            data.street_code = data.addressInfor[i].short_name;
            break;
          case 'administrative_area_level_2':
            data.district = data.addressInfor[i].long_name;
            data.district_code = data.addressInfor[i].short_name;
            break;
          case 'administrative_area_level_1':
            data.province = data.addressInfor[i].long_name;
            data.province_code = data.addressInfor[i].short_name;
            break;
          case 'country':
            data.country = data.addressInfor[i].long_name;
            data.country_code = data.addressInfor[i].short_name;
            break;
          case 'locality':
            data.city = data.addressInfor[i].long_name;
            data.city_code = data.addressInfor[i].short_name;
        }
        if (
          data.addressInfor[i].types.includes('sublocality') ||
          data.addressInfor[i].types.includes('sublocality_level_1')
        ) {
          data.ward = data.addressInfor[i].long_name;
          data.ward_code = data.addressInfor[i].short_name;
        }
      }
      if (!data.street) {
        throw new CustomError(locationErrorDetails.E_1008(), HttpStatus.BAD_REQUEST);
      }

      data.companyId = res.locals.staffPayload.companyId;
      let company: any = await CompanyModel.findOne({
        where: { id: data.companyId },
        include: [
          {
            model: CompanyDetailModel,
            as: 'companyDetail',
            required: false,
            attributes: ['businessName']
          },
          {
            model: CompanyTypeDetailModel,
            as: 'companyTypeDetails',
            through: { attributes: [] },
            required: false
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
      if (company.companyTypeDetails) {
        company.companyTypeDetails = company.companyTypeDetails.map((companyTypeDetail: any) => companyTypeDetail.name);
      }
      const existLocation = await LocationModel.findOne({
        where: {
          companyId: company.id
        }
      });
      let updateStaff = false;
      if (!existLocation) {
        updateStaff = true;
      }
      // check prefixCode
      if (data.prefixCode) {
        const prefixCode = await LocationModel.findOne({
          where: {
            prefixCode: data.prefixCode
          }
        });
        if (prefixCode) {
          throw new CustomError(
            locationErrorDetails.E_1011(`Prefix code ${data.prefixCode} is existed`),
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // start transaction
      transaction = await sequelize.transaction();
      const location = await LocationModel.create(data, { transaction });

      if (req.files?.length) {
        const images = (req.files as Express.Multer.File[]).map((x: any, index: number) => ({
          locationId: location.id,
          path: x.location,
          isAvatar: index === 0 ? true : false
        }));

        await LocationImageModel.bulkCreate(images, { transaction: transaction });
      }

      let pathName = '';
      if (data.address) {
        pathName = normalizeRemoveAccent(company.businessName) + '-' + normalizeRemoveAccent(data.address);
      } else {
        pathName = normalizeRemoveAccent(company.businessName) + '-' + uuidv4();
      }

      data = Object.assign(data, { pathName });

      if (req.file) {
        const dataImage = {
          locationId: location.id,
          path: (req.file as any).location,
          isAvatar: true
        };
        await LocationImageModel.create(dataImage, { transaction });
      }

      if (req.body.workingTimes && req.body.workingTimes.length > 0) {
        if (_.uniqBy(req.body.workingTimes, 'day').length !== req.body.workingTimes.length) {
          throw new CustomError(
            locationErrorDetails.E_1002('Weekday do not allow duplicate value'),
            HttpStatus.BAD_REQUEST
          );
        }
        const even = (element: any) => {
          return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
        };
        const checkValidWorkingTime = await req.body.workingTimes.some(even);
        if (checkValidWorkingTime) {
          throw new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST);
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
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false,
            where: {
              isAvatar: true
            }
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
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
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false,
            where: {
              isAvatar: true
            }
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
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const locationId = req.params.locationId;
      const validateErrors = validate(locationId, locationIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
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
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false
          }
        ]
      });
      if (!location) {
        throw new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND);
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (!(workingLocationIds as string[]).includes(locationId)) {
        throw new CustomError(
          locationErrorDetails.E_1001(`Can not access to this ${locationId}`),
          HttpStatus.NOT_FOUND
        );
      }
      const rowsDeleted: any = await LocationModel.destroy({
        where: {
          id: locationId
        }
      });
      if (!rowsDeleted) {
        throw new CustomError(locationErrorDetails.E_1000(`locationId ${locationId} not found`), HttpStatus.NOT_FOUND);
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      if (_.uniqBy(body.workingTimes, 'day').length !== body.workingTimes.length) {
        throw new CustomError(
          locationErrorDetails.E_1002('Weekday do not allow duplicate value'),
          HttpStatus.BAD_REQUEST
        );
      }
      if (!(workingLocationIds as string[]).includes(body.locationId)) {
        throw new CustomError(
          locationErrorDetails.E_1001(`Can not access to this ${body.locationId}`),
          HttpStatus.BAD_REQUEST
        );
      }
      const even = (element: any) => {
        return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
      };
      const checkValidWoringTime = await body.workingTimes.some(even);
      if (checkValidWoringTime) {
        throw new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST);
      }

      const existLocationWorkingHour = await LocationWorkingHourModel.findOne({
        where: {
          locationId: body.locationId
        }
      });
      if (existLocationWorkingHour) {
        throw new CustomError(
          locationErrorDetails.E_1003(`Location ${body.locationId} working hours is exist`),
          HttpStatus.BAD_REQUEST
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
   *       type: array
   *       items:
   *          type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: "description"
   *       type: string
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
   *     - in: "formData"
   *       name: "addressInfor"
   *       type: array
   *       items:
   *           type: object
   *     - in: "formData"
   *       name: "placeId"
   *       type: string
   *     - in: "formData"
   *       name: "fullAddress"
   *       type: string
   *     - in: "formData"
   *       name: deleteImages
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: prefixCode
   *       type: string
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
  public updateLocation = async ({ params, body, files }: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      let validateErrors: any;
      validateErrors = validate(params.locationId, locationIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      validateErrors = validate(body, updateLocationSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const location = await LocationModel.findOne({
        where: {
          id: params.locationId,
          companyId: companyId
        }
      });
      if (!location) {
        throw new CustomError(
          locationErrorDetails.E_1000(`locationId ${params.locationId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const data: any = {
        name: body.name,
        phone: body.phone,
        email: body.email,
        district: location.district,
        districtCode: location.districtCode,
        title: body.title,
        description: body.description,
        city: location.city,
        ward: location.ward,
        cityCode: location.cityCode,
        wardCode: location.wardCode,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        workingTimes: body.workingTimes,
        payment: body.payment,
        parking: body.parking,
        rating: body.rating,
        recoveryRooms: body.recoveryRooms,
        totalBookings: body.totalBookings,
        openedAt: body.openedAt,
        placeId: location.placeId,
        addressInfor: body.addressInfor,
        fullAddress: body.fullAddress,
        country: location.country,
        countryCode: location.countryCode,
        provinceCode: location.provinceCode,
        street: location.street,
        streetCode: location.streetCode,
        prefixCode: body.prefixCode
      };

      if (body.placeId && body.placeId !== location.placeId) {
        if (!body.addressInfor || body.addressInfor.length === 0) {
          throw new CustomError(locationErrorDetails.E_1009(), HttpStatus.NOT_FOUND);
        }
        if (!body.fullAddress) {
          throw new CustomError(locationErrorDetails.E_1010(), HttpStatus.NOT_FOUND);
        }
        for (let i = 0; i < body.addressInfor.length; i++) {
          switch (body.addressInfor[i].types[0]) {
            case 'route':
              data.street = body.addressInfor[i].long_name;
              data.streetCode = body.addressInfor[i].short_name;
              break;
            case 'administrative_area_level_2':
              data.district = body.addressInfor[i].long_name;
              data.districtCode = body.addressInfor[i].short_name;
              break;
            case 'administrative_area_level_1':
              data.province = body.addressInfor[i].long_name;
              data.provinceCode = body.addressInfor[i].short_name;
              break;
            case 'country':
              data.country = body.addressInfor[i].long_name;
              data.countryCode = body.addressInfor[i].short_name;
              break;
            case 'locality':
              data.city = body.addressInfor[i].long_name;
              data.cityCode = body.addressInfor[i].short_name;
          }
          if (
            body.addressInfor[i].types.includes('sublocality') ||
            body.addressInfor[i].types.includes('sublocality_level_1')
          ) {
            data.ward = body.addressInfor[i].long_name;
            data.wardCode = body.addressInfor[i].short_name;
          }
        }

        if (!data.street) {
          throw new CustomError(locationErrorDetails.E_1008(), HttpStatus.BAD_REQUEST);
        }
        data.placeId = body.placeId;
      }
      if (data.prefixCode) {
        const prefixCode = await LocationModel.findOne({
          where: {
            prefixCode: data.prefixCode
          }
        });
        if (prefixCode) {
          throw new CustomError(
            locationErrorDetails.E_1011(`Prefix code ${data.prefixCode} is existed`),
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // start transaction
      transaction = await sequelize.transaction();
      if (body.workingTimes && body.workingTimes.length > 0) {
        if (_.uniqBy(body.workingTimes, 'day').length !== body.workingTimes.length) {
          throw new CustomError(
            locationErrorDetails.E_1002('Weekday do not allow duplicate value'),
            HttpStatus.BAD_REQUEST
          );
        }
        if (!(workingLocationIds as string[]).includes(params.locationId)) {
          throw new CustomError(
            locationErrorDetails.E_1001(`Can not access to this ${params.locationId}`),
            HttpStatus.BAD_REQUEST
          );
        }
        const even = (element: any) => {
          return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
        };
        const checkValidWorkingTime = await body.workingTimes.some(even);
        if (checkValidWorkingTime) {
          throw new CustomError(locationErrorDetails.E_1004('startTime not before endTime'), HttpStatus.BAD_REQUEST);
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
      let isDeletedAvatar = false;
      if (body.deleteImages && body.deleteImages.length > 0) {
        const locationImages = await LocationImageModel.findAll({
          where: {
            id: body.deleteImages
          }
        });
        if (body.deleteImages.length !== locationImages.length) {
          throw new CustomError(locationErrorDetails.E_1013(), HttpStatus.NOT_FOUND);
        }

        for (let i = 0; i < locationImages.length; i++) {
          if (locationImages[i].isAvatar) {
            isDeletedAvatar = true;
          }
        }
        await LocationImageModel.destroy({ where: { id: body.deleteImages }, transaction });
      }

      if (files.length) {
        const images = (files as Express.Multer.File[]).map((x: any, index: number) => ({
          serviceId: location.id,
          path: x.location,
          isAvatar: index === 0 && isDeletedAvatar ? true : false
        }));
        await LocationImageModel.bulkCreate(images, { transaction: transaction });
      }

      //check prefixCode

      // if (data.prefixCode) {
      //   const prefixCode = await LocationModel.findOne({
      //     where: {
      //       prefixCode: data.prefixCode
      //     }
      //   });
      //   if (prefixCode) {
      //     throw new CustomError(
      //       locationErrorDetails.E_1011(`Prefix code ${data.prefixCode} is existed`),
      //       HttpStatus.BAD_REQUEST
      //     );
      //   }
      // }
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
   * /branch/location/get-prefix-codes:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getPrefixCodes
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getPrefixCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const prefixCodes = await LocationModel.findAll({
        where: { companyId: companyId },
        attributes: ['id', 'prefixCode']
      });
      if (!prefixCodes) {
        throw new CustomError(locationErrorDetails.E_1012('Prefix codes not existed'), HttpStatus.NOT_FOUND);
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(prefixCodes));
    } catch (error) {
      return next(error);
    }
  };
}
