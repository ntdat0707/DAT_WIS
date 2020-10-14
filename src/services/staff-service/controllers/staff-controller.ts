//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import _ from 'lodash';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails, branchErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
import { iterator } from '../../../utils/iterator';
import { timeSlots } from '../../../utils/time-slots';
import { minutesToNum } from '../../../utils/minutes-to-number';
import { dayOfWeek } from '../../../utils/day-of-week';
import { getStaffUnavailTime } from '../../../utils/unavail-time-array';
import { staffWithTime } from '../../../utils/staff-with-time';
import {
  sequelize,
  StaffModel,
  LocationModel,
  ServiceModel,
  LocationStaffModel,
  AppointmentModel,
  AppointmentDetailModel,
  CompanyModel,
  LocationWorkingHourModel,
  GroupStaffModel
} from '../../../repositories/postgres/models';

import {
  staffIdSchema,
  createStaffSchema,
  filterStaffSchema,
  createStaffsSchema,
  updateStaffSchema,
  getStaffMultipleService
} from '../configs/validate-schemas';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';

export class StaffController {
  /**
   * @swagger
   * /staff/get-staff/{staffId}:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
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
   *     security:
   *       - Bearer: []
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
            },
            {
              model: GroupStaffModel,
              as: 'groupStaff',
              required: true,
              where: { name: Sequelize.literal('unaccent("groupStaff"."name") ilike unaccent(\'%Bac si%\')') }
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
   *       name: groupStaffId
   *       type: string
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
   *       required: true
   *     - in: "formData"
   *       name: email
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
        groupStaffId: req.body.groupStaffId,
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
      if (req.body.email) {
        const checkEmailExists = await StaffModel.findOne({ where: { email: req.body.email } });
        if (checkEmailExists) return next(new CustomError(staffErrorDetails.E_4001(), HttpStatus.BAD_REQUEST));
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
   * /staff/complete-onboard:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: complete-onboard
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: |
   *           </br> xxx1: Something error
   *           </br> xxx2: Internal server errors
   */

  public completeOnboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const company = await CompanyModel.findOne({ where: { id: res.locals.staffPayload.companyId } });
      await StaffModel.update({ onboardStep: 5 }, { where: { id: company.ownerId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * definitions:
   *   StaffMultipleService:
   *       required:
   *           - locationId
   *           - serviceIds
   *       properties:
   *           locationId:
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
      const validateErrors = validate(dataInput, getStaffMultipleService);
      // const serviceIds = req.query.serviceIds;

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
          mainLocationId: dataInput.locationId,
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
   *           - currentTime
   *           - workDay
   *           - serviceDuration
   *       properties:
   *           staffId:
   *               type: string
   *           currentTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD
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
   *     security:
   *       - Bearer: []
   *     name: getStaffAvailableTimeSlots
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/StaffAvailableTimeSlots'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getStaffAvailableTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rangelist: number[] = [];
      const dataInput = { ...req.body };
      const validateErrors = validate(dataInput.staffId, staffIdSchema);
      const workDay = dataInput.workDay;
      const serviceDuration = dataInput.serviceDuration;
      const durationTime = minutesToNum(serviceDuration);
      const timeZone = moment.parseZone(dataInput.currentTime).utcOffset();
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
          }
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
      const appointmentDay = moment(workDay).format('YYYY-MM-DD').toString();
      const day = dayOfWeek(workDay);
      const workTime = iterator(data, day);
      const timeSlot = timeSlots(workTime.startTime, workTime.endTime, 5);
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
                sequelize.Sequelize.where(
                  sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('start_time')),
                  appointmentDay
                ),
                {
                  [Op.not]: [{ status: { [Op.like]: 'cancel' } }]
                }
              ]
            }
          }
        ],
        where: {
          id: dataInput.staffId
        }
      });
      const preDataFirst = JSON.stringify(doctorSchedule);
      const preDataSecond = JSON.parse(preDataFirst);
      if (preDataSecond.count > 0) {
        preDataSecond.rows[0].appointmentDetails.forEach((obj: any) => {
          obj.start_time = moment(obj.start_time).format('HH:mm').toString();
          const firstTimeSlot = parseInt(obj.start_time.split(':').join(''), 10);
          let finalTimeSlot;
          if (obj.duration >= 60) {
            const hour = Math.floor(obj.duration / 60);
            const minute = Math.round((obj.duration / 60 - hour) * 60);
            const finalTimeSlotM = (firstTimeSlot % 100) + minute;
            const finalTimeSlotH = Math.floor(firstTimeSlot / 100) + hour;
            const finalTimeSlotString = finalTimeSlotH.toString().concat(finalTimeSlotM.toString());
            finalTimeSlot = parseInt(finalTimeSlotString, 10);
          } else {
            const hour = Math.floor(obj.duration / 60);
            const minute = Math.round((obj.duration / 60 - hour) * 60);
            let finalTimeSlotM = (firstTimeSlot % 100) + minute;
            let finalTimeSlotH = Math.round(firstTimeSlot / 100) + hour;
            if (finalTimeSlotM === 60) {
              finalTimeSlotH = Math.floor(firstTimeSlot / 100) + 1;
              finalTimeSlotM = 0;
            } else if (finalTimeSlotM > 60) {
              finalTimeSlotH = Math.floor(firstTimeSlot / 100) + 1;
              finalTimeSlotM = finalTimeSlotM - 60;
            }
            const finalTimeSlotString = finalTimeSlotH.toString().concat(finalTimeSlotM.toString());
            finalTimeSlot = parseInt(finalTimeSlotString, 10);
          }
          const finTimeSlot = moment(finalTimeSlot, 'hmm').format('HH:mm');
          const firstTime = moment(firstTimeSlot, 'hmm').format('HH:mm');
          if (timeSlot.hasOwnProperty(obj.start_time)) {
            timeSlot[firstTime] = false;
            timeSlot[finTimeSlot] = false;
          }
          rangelist.push(finalTimeSlot);
          Object.keys(timeSlot).forEach((key: any, index: any) => {
            const indexStart = Object.keys(timeSlot).indexOf(firstTime);
            const indexEndTime = Object.keys(timeSlot).indexOf(finTimeSlot);
            if (index < indexEndTime && index > indexStart) {
              timeSlot[key] = false;
            }
          });
        });
      }

      for (let i = 0; i < rangelist.length - 1; i++) {
        for (let k = 1; k < rangelist.length; k++) {
          if (i + 1 === k) {
            if (rangelist[k] - rangelist[i] <= durationTime) {
              let temp;
              while (rangelist[i] < rangelist[k]) {
                rangelist[i] = rangelist[i] + 5;
                if (rangelist[i] % 100 === 60) {
                  rangelist[i] = (Math.floor(rangelist[i] / 100) + 1) * 100;
                }
                temp = moment(rangelist[i], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
            const stringEndtime = moment(workTime.endTime.split(':').join(''), 'hmm')
              .add(-timeZone, 'm')
              .format('HH:mm');
            //let semiEndtime = moment();
            const endTime = parseInt(stringEndtime.split(':').join(''), 10);
            timeSlot[stringEndtime] = false;
            if (endTime - rangelist[k] < durationTime) {
              let temp;
              while (rangelist[k] < endTime) {
                rangelist[k] = rangelist[k] + 5;
                if (rangelist[k] % 100 === 60) {
                  rangelist[k] = (Math.floor(rangelist[k] / 100) + 1) * 100;
                }
                temp = moment(rangelist[k], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
          }
        }
      }
      Object.keys(timeSlot).forEach((key: any) => {
        let temp;
        if (timeSlot[key] === true) {
          const stringEndtime = moment(workTime.endTime.split(':').join(''), 'hmm').add(-timeZone, 'm').format('HH:mm');
          const endTime = parseInt(stringEndtime.split(':').join(''), 10);
          temp = parseInt(key.split(':').join(''), 10);
          let tempTime = temp + durationTime;
          let firstTwoDigits = Math.floor(tempTime / 100);
          let lastTwoDigits = tempTime % 100;
          if (lastTwoDigits >= 60) {
            firstTwoDigits = Math.floor(tempTime / 100) + 1;
            lastTwoDigits = (tempTime % 100) - 60;
            tempTime = firstTwoDigits * 100 + lastTwoDigits;
          }
          if (tempTime > endTime) {
            timeSlot[key] = false;
          }
        }
      });
      const currentTime = parseInt(moment().utc().format('HH:mm').split(':').join(''), 10);
      const currentDay = moment().utc().format('YYYY-MM-DD');
      Object.keys(timeSlot).forEach((key: any) => {
        const temp = parseInt(key.split(':').join(''), 10);
        if (temp <= currentTime && currentDay === workDay) {
          const stringTemp = moment(temp, 'hmm').format('HH:mm');
          timeSlot[stringTemp] = false;
        }
      });

      const isBefore = moment(appointmentDay).isBefore(currentDay);
      if (isBefore === true) {
        Object.keys(timeSlot).forEach((key: any) => {
          timeSlot[key] = false;
        });
      }
      let newTimeSlot: any;
      const tempIsAvail: any[] = [];
      Object.keys(timeSlot).forEach((key: any) => {
        let tempTime = key.split(':').join('');
        const tempBool = timeSlot[key];
        tempIsAvail.push(tempBool);
        tempTime = moment(tempTime, 'hmm').add(timeZone, 'm').format('HH:mm');
        newTimeSlot = { ...newTimeSlot, [tempTime]: true };
      });
      for (let i = 0; i < tempIsAvail.length; i++) {
        Object.keys(newTimeSlot).forEach((key: any) => {
          if (Object.keys(newTimeSlot).indexOf(key) === i) {
            newTimeSlot[key] = tempIsAvail[i];
          }
        });
      }
      if (!workingTime) {
        return next(
          new CustomError(staffErrorDetails.E_4000(`staffId ${dataInput.staffId} not found`), HttpStatus.NOT_FOUND)
        );
      }
      res.status(HttpStatus.OK).send(buildSuccessMessage(newTimeSlot));
    } catch (error) {
      return error;
    }
  };

  /**
   * @swagger
   * definitions:
   *   RandomAvailableTimeSlots:
   *       required:
   *           - locationId
   *           - currentTime
   *           - workDay
   *           - serviceDuration
   *       properties:
   *           locationId:
   *               type: string
   *           currentTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD
   *           workDay:
   *               type: string
   *           serviceDuration:
   *               type: integer
   */

  /**
   * @swagger
   * /staff/get-random-available-time:
   *   post:
   *     tags:
   *       - Staff
   *     name: getRandomAvailableTimeSlots
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/RandomAvailableTimeSlots'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getRandomAvailableTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = { ...req.body };
      const serviceDuration = dataInput.serviceDuration;
      const locationId = dataInput.locationId;
      const workDay = dataInput.workDay;
      const staffIds: string[] = [];
      const durationTime = minutesToNum(serviceDuration);
      const timeZone = moment.parseZone(dataInput.currentTime).utcOffset();

      const workingTime = await LocationModel.findOne({
        attributes: [],
        include: [
          {
            model: LocationWorkingHourModel,
            as: 'workingTimes',
            attributes: ['weekday', 'startTime', 'endTime', 'isEnabled']
          }
        ],
        where: {
          id: locationId
        },
        raw: false,
        nest: true
      });
      const preData = JSON.stringify(workingTime.toJSON());
      const simplyData = JSON.parse(preData);
      const data = simplyData.workingTimes;

      const day = dayOfWeek(workDay);
      const workTime = iterator(data, day);

      const timeSlot = timeSlots(workTime.startTime, workTime.endTime, 5);
      const appointmentDay = moment(workDay).format('YYYY-MM-DD').toString();

      const doctorsSchedule = await StaffModel.findAndCountAll({
        attributes: ['id'],
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            through: { attributes: [] },
            attributes: ['duration', 'start_time', 'status'],
            where: {
              [Op.and]: [
                sequelize.Sequelize.where(
                  sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('start_time')),
                  appointmentDay
                ),
                {
                  [Op.not]: [{ status: { [Op.like]: 'cancel' } }]
                }
              ]
            }
          }
        ],
        where: {
          main_location_id: locationId
        }
      });
      const preDataFirst = JSON.stringify(doctorsSchedule);
      const preDataSecond = JSON.parse(preDataFirst);
      const len = preDataSecond.rows.length;
      for (let i = 0; i < len; i++) {
        preDataSecond.rows[i].appointmentDetails.forEach((e: any) => {
          e.start_time = moment(e.start_time).format('HH:mm');
        });
      }
      const staffUnavailTime = getStaffUnavailTime(preDataSecond);
      const doctors = await StaffModel.findAndCountAll({
        attributes: ['id'],
        where: {
          main_location_id: locationId
        }
      });
      for (let i = 0; i < doctors.count; i++) {
        staffIds.push(doctors.rows[i].id);
      }
      const noReferencesTimeSlots = staffWithTime(
        staffIds,
        staffUnavailTime,
        timeSlot,
        durationTime,
        appointmentDay,
        workDay
      );
      if (doctorsSchedule.count === 0) {
        for (let i = 0; i < noReferencesTimeSlots.length; i++) {
          noReferencesTimeSlots[i].staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
        }
      }
      const newTimeSlot: any[] = [];
      Object.keys(timeSlot).forEach((key: any) => {
        let tempTime = key.split(':').join('');
        tempTime = moment(tempTime, 'hmm').add(timeZone, 'm').format('HH:mm');
        newTimeSlot.push(tempTime);
      });
      for (let i = 0; i < noReferencesTimeSlots.length; i++) {
        noReferencesTimeSlots[i].time = newTimeSlot[i];
      }
      res.status(HttpStatus.OK).send(buildSuccessMessage(noReferencesTimeSlots));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   PostionStaffDetail:
   *       required:
   *           - staffId
   *           - index
   *       properties:
   *           staffId:
   *               type: string
   *           index:
   *               type: number
   *
   */
  /**
   * @swagger
   * definitions:
   *   SettingPositionStaff:
   *       required:
   *           - ownerId
   *           - listPostionStaff
   *       properties:
   *           ownerId:
   *               type: string
   *           listPostionStaff:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/PostionStaffDetail'
   */

  /**
   * @swagger
   * /staff/setting-position-staff:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: settingPositionStaff
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *          $ref: '#/definitions/SettingPositionStaff'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public settingPositionStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = { ...req.body };
      const validateErrors = validate(dataInput, getStaffMultipleService);
      // const serviceIds = req.query.serviceIds;

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
          mainLocationId: dataInput.locationId,
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
   * /staff/get-group-staff:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getGroupStaff
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
   *       name: companyId
   *       required: companyId
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
  public getGroupStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        where: { companyId: companyId }
      };
      const groupStaffs = await paginate(
        GroupStaffModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(groupStaffs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   *  @swagger
   * /staff/get-staff-in-group:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getStaffInGroup
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
   *       name: groupStaffId
   *       required: true
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
  public getStaffInGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const groupStaffId = req.query.groupStaffId;
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        where: { groupStaffId: groupStaffId }
      };
      const staffs = await paginate(
        StaffModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return next(error);
    }
  };
}
