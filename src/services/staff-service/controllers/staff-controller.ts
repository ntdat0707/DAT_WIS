//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment, { duration } from 'moment';
import _, { find } from 'lodash';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails, branchErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
import { iterator } from '../../../utils/iterator';
import { timeSlots } from '../../../utils/time-slots';
import {
  sequelize,
  StaffModel,
  LocationModel,
  ServiceModel,
  LocationStaffModel,
  AppointmentModel,
  AppointmentDetailModel,
  CompanyModel,
  LocationWorkingHourModel
} from '../../../repositories/postgres/models';

import {
  staffIdSchema,
  createStaffSchema,
  filterStaffSchema,
  createStaffsSchema,
  updateStaffSchema,
  getStaffMultipleService,
} from '../configs/validate-schemas';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { func, object } from 'joi';
import { time } from 'cron';

export class StaffController {
  /**
   * @swagger
   * /staff/get-staff/{staffId}:
   *   get:
   *     tags:
   *       - Staff
   *     name: get-staff
   *     parameters:
   *     - in: path
   *       name: staffId
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
  public getStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = req.params.staffId;
      const validateErrors = validate(staffId, staffIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.findOne({
        where: { id: staffId },
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] }
          }
        ]
      });
      if (!staff)
        return next(new CustomError(staffErrorDetails.E_4000(`staffId ${staffId} not found`), HttpStatus.NOT_FOUND));

      return res.status(HttpStatus.OK).send(buildSuccessMessage(staff));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/get-staffs:
   *   get:
   *     tags:
   *       - Staff
   *     name: get-staffs
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
   *     - in: query
   *       name: workingLocationIds
   *       schema:
   *          type: array
   *          items:
   *             type: string
   *       description: array of UUID v4
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getStaffs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const filter = { workingLocationIds: req.query.workingLocationIds };
      const validateFilterErrors = validate(filter, filterStaffSchema);
      if (validateFilterErrors) return next(new CustomError(validateFilterErrors, HttpStatus.BAD_REQUEST));

      const query: FindOptions = { include: [] };
      if (
        filter.workingLocationIds &&
        Array.isArray(filter.workingLocationIds) &&
        filter.workingLocationIds.every((e: any) => typeof e === 'string')
      ) {
        const diff = _.difference(filter.workingLocationIds as string[], workingLocationIds);
        if (diff.length) {
          return next(
            new CustomError(
              branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
              HttpStatus.FORBIDDEN
            )
          );
        }
        query.include = [
          ...query.include,
          ...[
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              through: {
                attributes: []
              },
              where: { id: filter.workingLocationIds }
            }
          ]
        ];
        //
      } else {
        query.include = [
          ...query.include,
          ...[
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              where: { id: workingLocationIds }
            }
          ]
        ];
      }

      const staffs = await paginate(
        StaffModel.scope('safe'),
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/create:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: createStaff
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "avatar"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: mainLocationId
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: firstName
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: lastName
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: gender
   *       type: integer
   *       required: true
   *     - in: "formData"
   *       name: phone
   *       type: string
   *     - in: "formData"
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: passportNumber
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: color
   *       type: string
   *     - in: "formData"
   *       name: workingLocationIds
   *       type: array
   *       required: true
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: serviceIds
   *       type: array
   *       items:
   *          type: string
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
  public createStaff = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const validateErrors = validate(req.body, createStaffSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const profile: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        mainLocationId: req.body.mainLocationId,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        color: req.body.color,
        id: uuidv4()
      };
      if (!res.locals.staffPayload.workingLocationIds.includes(profile.mainLocationId))
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${profile.mainLocationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      if (req.body.workingLocationIds) {
        const diff = _.difference(req.body.workingLocationIds, res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          return next(
            new CustomError(
              branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
              HttpStatus.FORBIDDEN
            )
          );
        }
      }
      if (req.file) profile.avatarPath = (req.file as any).location;
      const staff = await StaffModel.create(profile, { transaction });
      if (req.body.workingLocationIds) {
        const workingLocationData = (req.body.workingLocationIds as []).map((x) => ({
          locationId: x,
          staffId: profile.id
        }));
        await LocationStaffModel.bulkCreate(workingLocationData, { transaction });
      }
      if (req.body.serviceIds) {
        const serviceStaffData = (req.body.serviceIds as []).map((x) => ({
          serviceId: x,
          staffId: profile.id
        }));
        await ServiceStaffModel.bulkCreate(serviceStaffData, { transaction });
      }
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staff));
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
   * /staff/update/{staffId}:
   *   put:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: updateStaff
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "path"
   *       name: "staffId"
   *       required: true
   *     - in: "formData"
   *       name: "avatar"
   *       type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: firstName
   *       type: string
   *     - in: "formData"
   *       name: lastName
   *       type: string
   *     - in: "formData"
   *       name: gender
   *       type: integer
   *     - in: "formData"
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: phone
   *       type: string
   *     - in: "formData"
   *       name: passportNumber
   *       type: string
   *     - in: "formData"
   *       name: color
   *       type: string
   *     - in: "formData"
   *       name: workingLocationIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: serviceIds
   *       type: array
   *       items:
   *          type: string
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
  public updateStaff = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const validateErrors = validate(req.body, updateStaffSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const profile: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        phone: req.body.phone,
        color: req.body.color,
        isAllowedMarketPlace: req.body.isAllowedMarketPlace
      };
      if (req.file) profile.avatarPath = (req.file as any).location;

      if (req.body.workingLocationIds) {
        const diff = _.difference(req.body.workingLocationIds, res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
          );
        }
      }
      let staff = await StaffModel.findOne({
        where: {
          id: req.params.staffId
        },
        attributes: {
          exclude: ['password']
        }
      });

      staff = await staff.update(profile, {
        transaction: transaction
      });
      //
      //If body.workingLocationIds === currently location, not need change location of user.

      const handleLocationIds = await this.handleEditStaffLocations(req.params.staffId, req.body.workingLocationIds);
      if (handleLocationIds.locationIdsAdded.length) {
        await LocationStaffModel.bulkCreate(
          handleLocationIds.locationIdsAdded.map((locationId) => ({
            staffId: req.params.staffId,
            locationId: locationId
          })),
          { transaction: transaction }
        );
      }
      if (handleLocationIds.locationIdsRemoved.length) {
        await LocationStaffModel.destroy({
          where: {
            locationId: handleLocationIds.locationIdsRemoved,
            staffId: req.params.staffId
          },
          transaction: transaction
        });
      }
      if (req.body.serviceIds) {
        const handleServiceIds = await this.handleEditStaffServices(req.params.staffId, req.body.serviceIds);
        if (handleServiceIds.serviceIdsAdded.length) {
          await ServiceStaffModel.bulkCreate(
            handleServiceIds.serviceIdsAdded.map((serviceId) => ({
              staffId: req.params.staffId,
              serviceId: serviceId
            })),
            { transaction: transaction }
          );
        }
        if (handleServiceIds.serviceIdsRemoved.length) {
          await ServiceStaffModel.destroy({
            where: {
              serviceId: handleServiceIds.serviceIdsRemoved,
              staffId: req.params.staffId
            },
            transaction: transaction
          });
        }
      }
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staff));
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  async handleEditStaffLocations(staffId: string, locationIdsPayload: string[]) {
    const currentLocationIdsOfStaff = await LocationStaffModel.findAll({
      where: {
        staffId: staffId
      }
    }).then((locationStaffs) => locationStaffs.map(({ locationId }) => locationId));
    const currentLocationIdsLocked = await AppointmentModel.findAll({
      where: {
        locationId: locationIdsPayload,
        date: {
          [Op.gte]: moment().toDate()
        }
      },
      include: [
        {
          model: AppointmentDetailModel,
          as: 'appointmentDetails',
          include: [
            {
              model: StaffModel,
              as: 'staffs',
              where: {
                id: staffId
              }
            }
          ]
        }
      ]
    }).then((rows: any[]) => rows.map(({ locationId }: any) => locationId));
    const locationIdsNoDeleted = _.difference(currentLocationIdsLocked, locationIdsPayload);
    if (locationIdsNoDeleted.length) {
      throw new CustomError(staffErrorDetails.E_4009(), HttpStatus.FORBIDDEN);
    }
    const locationIdsRemoved = _.difference(currentLocationIdsOfStaff, locationIdsPayload);
    const locationIdsAdded = _.difference(locationIdsPayload, currentLocationIdsOfStaff);
    return {
      locationIdsRemoved,
      locationIdsAdded
    };
  }

  async handleEditStaffServices(staffId: string, serviceIdsPayload: string[]) {
    const currentServiceIdsOfStaff = await ServiceStaffModel.findAll({
      where: {
        staffId: staffId
      }
    }).then((locationStaffs) => locationStaffs.map(({ serviceId }) => serviceId));

    const serviceIdsLocked = await AppointmentDetailModel.findAll({
      attributes: ['serviceId'],
      where: {
        serviceId: serviceIdsPayload,
        startTime: {
          [Op.gte]: moment().toDate()
        }
      },
      include: [
        {
          model: StaffModel,
          as: 'staffs',
          where: {
            id: staffId
          }
        }
      ]
    })
      .then((rows) => rows.map(({ serviceId }: any): string => serviceId))
      .then((x) => _.uniq(x));

    // Check service appointment will used in appointment feature.
    if (_.difference(serviceIdsLocked, serviceIdsPayload).length) {
      throw new CustomError(staffErrorDetails.E_40010(), HttpStatus.FORBIDDEN);
    }

    const serviceIdsRemoved = _.difference(currentServiceIdsOfStaff, serviceIdsPayload);
    const serviceIdsAdded = _.difference(serviceIdsPayload, currentServiceIdsOfStaff);
    return {
      serviceIdsRemoved: serviceIdsRemoved,
      serviceIdsAdded: serviceIdsAdded
    };
  }

  /**
   * @swagger
   * /staff/get-all-staffs:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getAllStaffs
   *     parameters:
   *     - in: query
   *       name: workingLocationIds
   *       schema:
   *          type: array
   *          items:
   *             type: string
   *       description: array of UUID v4
   *     - in: query
   *       name: serviceIds
   *       schema:
   *          type: array
   *          items:
   *             type: string
   *       description: array of UUID v4
   *     responses:
   *       200:
   *         description: success
   *       403:
   *         description: Forbiden
   *       500:
   *         description: Server internal error
   */
  public getAllStaffs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const validateErrors = validate(req.query, filterStaffSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        include: [],
        where: {}
      };
      if (
        req.query.workingLocationIds &&
        Array.isArray(req.query.workingLocationIds) &&
        req.query.workingLocationIds.every((e: any) => typeof e === 'string')
      ) {
        const diff = _.difference(req.query.workingLocationIds as string[], res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          return next(
            new CustomError(
              branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
              HttpStatus.FORBIDDEN
            )
          );
        }

        query.include = [
          ...query.include,
          ...[
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              through: {
                attributes: []
              },
              where: { id: req.query.workingLocationIds }
            }
          ]
        ];
      } else {
        query.include = [
          ...query.include,
          ...[
            {
              model: LocationModel,
              as: 'workingLocations',
              required: true,
              where: { id: workingLocationIds }
            }
          ]
        ];
      }

      if (req.query.serviceIds) {
        query.include = [
          ...query.include,
          ...[
            {
              model: ServiceModel,
              as: 'services',
              required: true,
              through: {
                attributes: []
              },
              where: { id: req.query.serviceIds }
            }
          ]
        ];
      } else {
        query.include = [
          ...query.include,
          ...[
            {
              model: ServiceModel,
              as: 'services'
            }
          ]
        ];
      }

      const staffs = await StaffModel.scope('safe').findAll(query);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/delete-staff/{staffId}:
   *   delete:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: delete-staff
   *     parameters:
   *     - in: path
   *       name: staffId
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
  public deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const staffId = req.params.staffId;
      const validateErrors = validate(staffId, staffIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.findOne({ where: { id: staffId } });
      if (!staff)
        return next(new CustomError(staffErrorDetails.E_4000(`staffId ${staffId} not found`), HttpStatus.NOT_FOUND));
      if (!workingLocationIds.includes(staff.mainLocationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${staff.mainLocationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await StaffModel.destroy({ where: { id: staffId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateStaffDetail:
   *       required:
   *           - firstName
   *           - lastName
   *       properties:
   *           firstName:
   *               type: string
   *           lastName:
   *               type: string
   *           email:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateStaffs:
   *       required:
   *           - mainLocationId
   *           - staffDetails
   *       properties:
   *           mainLocationId:
   *               type: string
   *           staffDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateStaffDetail'
   *
   */
  /**
   * @swagger
   * /staff/create-staffs:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: createStaffs
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateStaffs'
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
  public createStaffs = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, createStaffsSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const profiles = [];
      for (let i = 0; i < req.body.staffDetails.length; i++) {
        const profile = {
          mainLocationId: req.body.mainLocationId,
          firstName: req.body.staffDetails[i].firstName,
          lastName: req.body.staffDetails[i].lastName,
          email: req.body.staffDetails[i].email ? req.body.staffDetails[i].email : null,
          isBusinessAccount: false
        };
        profiles.push(profile);
      }
      if (!res.locals.staffPayload.workingLocationIds.includes(req.body.mainLocationId))
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${req.body.mainLocationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      transaction = await sequelize.transaction();
      const staffs = await StaffModel.bulkCreate(profiles, { transaction });
      const workingLocationData = (staffs as []).map((x: any) => ({
        locationId: req.body.mainLocationId,
        staffId: x.id
      }));
      await LocationStaffModel.bulkCreate(workingLocationData, { transaction });
      const company = await CompanyModel.findOne({ where: { id: res.locals.staffPayload.companyId } });
      await StaffModel.update({ onboardStep: 3 }, { where: { id: company.ownerId }, transaction });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
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
   * definitions:
   *   StaffMultipleService:
   *       required:
   *           - mainLocationId
   *           - serviceIds
   *       properties:
   *           mainLocationId:
   *               type: string
   *           serviceIds:
   *               type: array
   *               items:
   *                   type: string
   *
   */

  /**
   * @swagger
   * /staff/get-staffs-multiple-service:
   *   post:
   *     tags:
   *       - Staff
   *     name: getStaffsServices
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffMultipleService'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getStaffsServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = { ...req.body };
      console.log('ServiceIDs:::', req.body);
      const validateErrors = validate(dataInput, getStaffMultipleService);
      // const serviceIds = req.query.serviceIds;

      const listService = dataInput.serviceIds.toString().split(',').join();
      console.log('listService::', listService);

      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      const staffIds = await ServiceStaffModel.findAll({
        where: {
          serviceId: {
            [Op.in]: dataInput.serviceIds
          }
        }
      }).then((services) => services.map((service) => service.staffId));
      const staffs = await StaffModel.findAll({
        where: {
          mainLocationId: dataInput.mainLocationId,
          id: {
            [Op.in]: staffIds
          }
        }
      });

      if (!staffs) {
        return next(new CustomError(staffErrorDetails.E_4000('staff not found'), HttpStatus.NOT_FOUND));
      }

      res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return error;
    }
  };

  /**
     * @swagger
     * definitions:
     *   StaffAvailableTimeSlots:
     *       required:
     *           - staffId
     *           - workDay
     *           - serviceDuration
     *       properties:
     *           staffId:
     *               type: string
     *           workDay:
     *               type: string
     *           serviceDuration: 
     *               type: integer
     */

  /**
   * @swagger
   * /staff/get-staff-available-time:
   *   post:
   *     tags:
   *       - Staff
   *     name: getStaffAvailableTimeSlots
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/StaffAvailableTimeSlots'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getStaffAvailableTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let rangelist: Array<number> = [];
      let duration: number;
      const dataInput = { ...req.body };
      //console.log('staffid:::', req.body.staffId);
      const validateErrors = validate(dataInput.staffId, staffIdSchema);
      const workDay = dataInput.workDay;
      const serviceDuration = dataInput.serviceDuration;
      if (serviceDuration == 60) {
        duration = 100;
      } else if (serviceDuration < 60) {
        duration = serviceDuration;
      } else {
        duration = (serviceDuration / 60) * 100;
      }
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const workingTime = await StaffModel.findOne({
        attributes: [],
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            required: true,
            through: { attributes: [] },
            include: [
              {
                model: LocationWorkingHourModel,
                as: 'workingTimes',
                attributes: ['weekday', 'startTime', 'endTime', 'isEnabled']
              }
            ]
          },
        ],
        where: {
          id: dataInput.staffId
        },
        raw: false,
        nest: true
      });
      const preData = JSON.stringify(workingTime.toJSON());
      const simplyData = JSON.parse(preData);
      const data = simplyData.workingLocations['0'].workingTimes;
      const dayOfWeek = moment(workDay).day();
      const appointmentDay = moment(workDay).format('YYYY-MM-DD').toString();
      let day;
      switch (dayOfWeek) {
        case 0:
          day = 'sunday';
          break;
        case 1:
          day = 'monday';
          break;
        case 2:
          day = 'tuesday';
          break;
        case 3:
          day = 'wednesday';
          break;
        case 4:
          day = 'thursday';
          break;
        case 5:
          day = 'friday';
          break;
        case 6:
          day = 'saturday';
      }
      const workTime = iterator(data, day);
      //console.log(workTime);
      const timeSlot = timeSlots(workTime.startTime, workTime.endTime, 5);
      //console.log(timeSlot);
      const doctorSchedule = await StaffModel.findAndCountAll({
        attributes: [],
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            through: { attributes: [] },
            attributes: ['duration', 'start_time', 'status'],
            where: {
              [Op.and]: [
                sequelize.Sequelize.where(sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('start_time')), appointmentDay),
                {
                  [Op.not]: [
                    { status: { [Op.like]: 'cancel' } }
                  ]
                }
              ]
            }
          }
        ],
        where: {
          id: dataInput.staffId,
        },
      });
      const preDataFirst = JSON.stringify(doctorSchedule);
      const preDataSecond = JSON.parse(preDataFirst);
      //console.log(preDataSecond);
      console.log(preDataSecond.count);
      if (preDataSecond.count > 0) {
        preDataSecond.rows[0].appointmentDetails.forEach((obj: any) => {
          obj.start_time = moment(obj.start_time).format('HH:mm').toString();
          let firstTimeSlot = parseInt(obj.start_time.split(':').join(''));
          let finalTimeSlot;
          if (obj.duration >= 60) {
            let hour = Math.floor(obj.duration / 60);
            let minute = Math.round(((obj.duration / 60) - hour) * 60);
            let finalTimeSlotM = (firstTimeSlot % 100) + minute;
            let finalTimeSlotH = Math.floor(firstTimeSlot / 100) + hour;
            let finalTimeSlotString = finalTimeSlotH.toString().concat(finalTimeSlotM.toString());
            finalTimeSlot = parseInt(finalTimeSlotString);

          } else {
            //console.log(firstTimeSlot);
            let hour = Math.floor(obj.duration / 60);
            let minute = Math.round(((obj.duration / 60) - hour) * 60);
            let finalTimeSlotM = (firstTimeSlot % 100) + minute;
            let finalTimeSlotH = Math.round(firstTimeSlot / 100) + hour;
            if (finalTimeSlotM == 60) {
              finalTimeSlotH = Math.floor(firstTimeSlot / 100) + 1;
              finalTimeSlotM = 0;
            }
            else if (finalTimeSlotM > 60) {
              finalTimeSlotH = Math.floor(firstTimeSlot / 100) + 1;
              finalTimeSlotM = finalTimeSlotM - 60;
            }
            let finalTimeSlotString = finalTimeSlotH.toString().concat(finalTimeSlotM.toString());
            finalTimeSlot = parseInt(finalTimeSlotString);
          };
          let finTimeSlot = moment(finalTimeSlot, 'hmm').format('HH:mm');
          let firstTime = moment(firstTimeSlot, 'hmm').format('HH:mm');
          if (timeSlot.hasOwnProperty(obj.start_time)) {
            timeSlot[firstTime] = false;
            timeSlot[finTimeSlot] = false;
          };
          console.log(finTimeSlot);
          rangelist.push(finalTimeSlot);
          Object.keys(timeSlot).forEach((key: any, index: any) => {
            let indexStart = Object.keys(timeSlot).indexOf(firstTime);
            let indexEndTime = Object.keys(timeSlot).indexOf(finTimeSlot);
            if (index < indexEndTime && index > indexStart) {
              timeSlot[key] = false;
            };
          });
        });
      }

      for (let i = 0; i < rangelist.length - 1; i++) {
        for (let k = 1; k < rangelist.length; k++) {
          if (i + 1 == k) {
            if ((rangelist[k] - rangelist[i]) <= duration) {
              let temp;
              while (rangelist[i] < rangelist[k]) {
                rangelist[i] = rangelist[i] + 5;
                if ((rangelist[i] % 100) == 60) {
                  rangelist[i] = (Math.floor(rangelist[i] / 100) + 1) * 100;
                }
                temp = moment(rangelist[i], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
            //console.log(moment(workTime.endTime.split(':').join(''),'hmm').format('HH:mm'));
            let stringEndtime=moment(workTime.endTime.split(':').join(''),'hmm').format('HH:mm');
            //let semiEndtime = moment();
            let endTime = parseInt(stringEndtime.split(':').join(''));
            timeSlot[stringEndtime] = false;
            if (endTime - rangelist[k] < duration) {
              let temp;
              while (rangelist[k] < endTime) {
                rangelist[k] = rangelist[k] + 5;
                if ((rangelist[k] % 100) == 60) {
                  rangelist[k] = (Math.floor(rangelist[k] / 100) + 1) * 100;
                }
                temp = moment(rangelist[k], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
          }
        };
      }
      Object.keys(timeSlot).forEach((key:any)=>{
        let temp;
        if(timeSlot[key] == true){
          let stringEndtime=moment(workTime.endTime.split(':').join(''),'hmm').format('HH:mm');
          let endTime = parseInt(stringEndtime.split(':').join(''));
          temp = parseInt(key.split(':').join(''));
          if(temp + duration > endTime ){
            timeSlot[key] = false;
          }
        }
      });
      //console.log(rangelist);

      if (!workingTime) {
        return next(new CustomError(staffErrorDetails.E_4000(`staffId ${dataInput.staffId} not found`), HttpStatus.NOT_FOUND));
      }
      res.status(HttpStatus.OK).send(buildSuccessMessage(timeSlot));
    } catch (error) {
      return error;
    }
  }
}
