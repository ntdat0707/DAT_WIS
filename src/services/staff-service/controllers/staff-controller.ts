import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op, Sequelize, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import _ from 'lodash';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import {
  staffErrorDetails,
  branchErrorDetails,
  roleErrorDetails
} from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
import { iterator } from '../../../utils/iterator';
import { timeSlots } from '../../../utils/time-slots';
import { minutesToNum } from '../../../utils/minutes-to-number';
import { dayOfWeek } from '../../../utils/day-of-week';
import { getStaffUnavailTime } from '../../../utils/unavail-time-array';
import { staffWithTime } from '../../../utils/staff-with-time';
import { Unaccent } from '../../../utils/unaccent';
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
  TeamModel,
  CateServiceModel,
  PositionModel,
  RoleModel
} from '../../../repositories/postgres/models';
import {
  staffIdSchema,
  createStaffSchema,
  filterStaffSchema,
  createStaffsSchema,
  updateStaffSchema,
  getStaffMultipleService,
  deleteStaffSchema,
  settingPositionStaffSchema
} from '../configs/validate-schemas';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { ERoleDefault } from '../../../utils/consts';

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
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = req.params.staffId;
      const validateErrors = validate(staffId, staffIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staff: any = await StaffModel.scope('safe').findOne({
        where: { id: staffId },
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] }
          },
          {
            model: TeamModel,
            as: 'teamStaffs',
            through: { attributes: [] },
            required: false
          }
        ]
      });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`staffId ${staffId} not found`), HttpStatus.NOT_FOUND);
      }
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
   *     - in: query
   *       name: teamIds
   *       schema:
   *          type: array
   *          items:
   *             type: string
   *       description: array of UUID v4
   *     - in: query
   *       name: searchValue
   *       required: false
   *       schema:
   *          type: string
   *     - in: query
   *       name: isServiceProvider
   *       required: false
   *       schema:
   *          type: boolean
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
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const filter = {
        workingLocationIds: req.query.workingLocationIds,
        teamIds: req.query.teamIds,
        isServiceProvider: req.query.isServiceProvider
      };
      const validateFilterErrors = validate(filter, filterStaffSchema);
      if (validateFilterErrors) {
        throw new CustomError(validateFilterErrors, HttpStatus.BAD_REQUEST);
      }
      const query: FindOptions = {
        include: [],
        where: {},
        order: [[{ model: PositionModel, as: 'positions' }, 'index', 'ASC']]
      };

      if (filter.isServiceProvider !== null && filter.isServiceProvider !== undefined) {
        query.where = {
          ...query.where,
          ...{
            isServiceProvider: filter.isServiceProvider
          }
        };
      }
      if (
        filter.workingLocationIds &&
        Array.isArray(filter.workingLocationIds) &&
        filter.workingLocationIds.every((e: any) => typeof e === 'string')
      ) {
        const diff = _.difference(filter.workingLocationIds as string[], workingLocationIds);
        if (diff.length) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
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
              model: PositionModel,
              as: 'positions',
              required: false,
              attributes: ['staff_id', 'index', 'location_id'],
              where: { locationId: filter.workingLocationIds }
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
            },
            {
              model: PositionModel,
              as: 'positions',
              required: false,
              attributes: ['staff_id', 'index', 'location_id'],
              where: { locationId: workingLocationIds }
            }
          ]
        ];
      }
      if (filter.teamIds && Array.isArray(filter.teamIds) && filter.teamIds.every((e: any) => typeof e === 'string')) {
        query.include = [
          ...query.include,
          ...[
            {
              model: TeamModel,
              as: 'teamStaffs',
              required: true,
              where: { id: filter.teamIds }
            }
          ]
        ];
      }
      if (req.query.searchValue) {
        const unaccentSearchValue = Unaccent(req.query.searchValue);
        const searchVal = sequelize.escape(`%${unaccentSearchValue}%`);
        // TODO: warning sql injection ilike email
        query.where = {
          [Op.or]: [
            Sequelize.literal(
              `unaccent(concat("StaffModel"."last_name", ' ', "StaffModel"."first_name")) ilike ${searchVal}`
            ),
            Sequelize.literal(`"StaffModel"."staff_code" ilike ${searchVal}`),
            Sequelize.literal(`"StaffModel"."phone" like ${searchVal}`),
            Sequelize.literal(`"StaffModel"."email" ilike %${unaccentSearchValue}%`)
          ]
        };
      }
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
   *       name: roleId
   *       type: string
   *     - in: "formData"
   *       name: statusRole
   *       type: string
   *       enum: ['active', 'inactive']
   *     - in: "formData"
   *       name: isServiceProvider
   *       type: boolean
   *       required: true
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const profile: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email,
        birthDate: req.body.birthDate,
        passportNumber: req.body.passportNumber,
        address: req.body.address,
        color: req.body.color,
        isServiceProvider: req.body.isServiceProvider,
        roleId: req.body.roleId,
        statusRole: req.body.statusRole,
        id: uuidv4()
      };

      if (req.body.workingLocationIds) {
        const diff = _.difference(req.body.workingLocationIds, res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
          );
        }
      }
      if (req.body.email) {
        const checkEmailExists = await StaffModel.scope('safe').findOne({ where: { email: req.body.email } });
        if (checkEmailExists) {
          throw new CustomError(staffErrorDetails.E_4001(), HttpStatus.BAD_REQUEST);
        }
      }
      if (req.file) {
        profile.avatarPath = (req.file as any).location;
      }
      if (profile.roleId) {
        const role = await RoleModel.findOne({ where: { id: profile.roleId } });
        if (!role) {
          throw new CustomError(roleErrorDetails.E_3801(`roleId ${profile.roleId} not found`), HttpStatus.NOT_FOUND);
        }
        if (role.roleName === ERoleDefault.SUPER_ADMIN) {
          throw new CustomError(
            roleErrorDetails.E_3804(`can not assign role ${role.roleName} for staff`),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      const staff = await StaffModel.create(profile, { transaction });

      if (req.body.workingLocationIds) {
        const workingLocationData = (req.body.workingLocationIds as []).map((x) => ({
          locationId: x,
          staffId: profile.id
        }));
        await LocationStaffModel.bulkCreate(workingLocationData, { transaction });

        for (let i = 0; i < req.body.workingLocationIds.length; i++) {
          const getMaxIndex: number = await PositionModel.max('index', {
            where: {
              ownerId: res.locals.staffPayload.id,
              locationId: req.body.workingLocationIds[i]
            }
          });

          if (getMaxIndex) {
            const position = {
              ownerId: res.locals.staffPayload.id,
              staffId: profile.id,
              index: getMaxIndex + 1,
              locationId: req.body.workingLocationIds[i]
            };
            await PositionModel.create(position, { transaction });
          } else {
            const staffs = await StaffModel.findAll({
              include: [
                {
                  model: LocationModel,
                  as: 'workingLocations',
                  required: true,
                  where: { id: req.body.workingLocationIds[i] }
                }
              ]
            });

            const dataPosition = staffs.map((x, index) => ({
              ownerId: res.locals.staffPayload.id,
              staffId: x.id,
              index: index,
              locationId: req.body.workingLocationIds[i]
            }));

            dataPosition.push({
              ownerId: res.locals.staffPayload.id,
              staffId: profile.id,
              index: staffs.length,
              locationId: req.body.workingLocationIds[i]
            });
            await PositionModel.bulkCreate(dataPosition, { transaction });
          }
        }
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
   *       name: birthDate
   *       type: string
   *     - in: "formData"
   *       name: phone
   *       type: string
   *     - in: "formData"
   *       name: passportNumber
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: color
   *       type: string
   *     - in: "formData"
   *       name: roleId
   *       type: string
   *     - in: "formData"
   *       name: statusRole
   *       type: string
   *       enum: ['active', 'inactive']
   *     - in: "formData"
   *       name: isServiceProvider
   *       type: boolean
   *     - in: "formData"
   *       name: isAllowedMarketPlace
   *       type: boolean
   *       required: true
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
        isAllowedMarketPlace: req.body.isAllowedMarketPlace,
        isServiceProvider: req.body.isServiceProvider,
        roleId: req.body.roleId,
        statusRole: req.body.statusRole
      };
      if (req.file) {
        profile.avatarPath = (req.file as any).location;
      }

      if (req.body.workingLocationIds) {
        const diff = _.difference(req.body.workingLocationIds, res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
          );
        }
      }

      let staff: any = await StaffModel.scope('safe').findOne({
        where: {
          id: req.params.staffId
        },
        attributes: {
          exclude: ['password']
        },
        include: [
          {
            model: RoleModel,
            as: 'role',
            required: false
          }
        ]
      });
      if (profile.roleId) {
        const role = await RoleModel.findOne({ where: { id: profile.roleId } });
        if (!role) {
          throw new CustomError(roleErrorDetails.E_3801(`roleId ${profile.roleId} not found`), HttpStatus.NOT_FOUND);
        }
        if (
          (staff.role &&
            staff.role.roleName !== ERoleDefault.SUPER_ADMIN &&
            role.roleName === ERoleDefault.SUPER_ADMIN) ||
          (!staff.role && role.roleName === ERoleDefault.SUPER_ADMIN)
        ) {
          throw new CustomError(
            roleErrorDetails.E_3804(`can not assign role ${role.roleName} for staff`),
            HttpStatus.BAD_REQUEST
          );
        }
      }

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
      throw new CustomError(staffErrorDetails.E_4010(), HttpStatus.FORBIDDEN);
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
   *         description: Forbidden
   *       500:
   *         description: Server internal error
   */
  public getAllStaffs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const validateErrors = validate(req.query, filterStaffSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
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
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
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

      const staffs = await StaffModel.findAll(query);
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
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const dataDelete = {
        staffId: req.params.staffId
      };
      const validateErrors = validate(dataDelete, deleteStaffSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staff = await StaffModel.scope('safe').findOne({ where: { id: dataDelete.staffId } });
      if (!staff) {
        throw new CustomError(
          staffErrorDetails.E_4000(`staffId ${dataDelete.staffId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      transaction = await sequelize.transaction();
      await StaffModel.destroy({ where: { id: dataDelete.staffId }, transaction });
      await LocationStaffModel.destroy({ where: { staffId: dataDelete.staffId }, transaction });
      await ServiceStaffModel.destroy({ where: { staffId: dataDelete.staffId }, transaction });
      await PositionModel.destroy({ where: { staffId: dataDelete.staffId }, transaction });
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
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
   *           - locationId
   *           - staffDetails
   *       properties:
   *           locationId:
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const profiles = [];
      for (let i = 0; i < req.body.staffDetails.length; i++) {
        const profile = {
          locationId: req.body.locationId,
          firstName: req.body.staffDetails[i].firstName,
          lastName: req.body.staffDetails[i].lastName,
          email: req.body.staffDetails[i].email ? req.body.staffDetails[i].email : null,
          isBusinessAccount: false
        };
        profiles.push(profile);
      }
      if (!res.locals.staffPayload.workingLocationIds.includes(req.body.locationId)) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
          HttpStatus.FORBIDDEN
        );
      }
      transaction = await sequelize.transaction();
      const staffs = await StaffModel.bulkCreate(profiles, { transaction });
      const workingLocationData = (staffs as []).map((x: any) => ({
        locationId: req.body.locationId,
        staffId: x.id
      }));
      await LocationStaffModel.bulkCreate(workingLocationData, { transaction });
      const company = await CompanyModel.findOne({ where: { id: res.locals.staffPayload.companyId } });
      await StaffModel.update({ onboardStep: 3 }, { where: { id: company.ownerId }, transaction });

      const arrPosition = [];
      for (let i = 0; i < staffs.length; i++) {
        const position = {
          ownerId: res.locals.staffPayload.id,
          staffId: staffs[i].id,
          index: i,
          locationId: req.body.locationId
        };
        arrPosition.push(position);
      }
      await PositionModel.bulkCreate(arrPosition, { transaction });
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

  public completeOnboard = async (_req: Request, res: Response, next: NextFunction) => {
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
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staffs = await StaffModel.findAll({
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] },
            required: true,
            attributes: [],
            where: { id: dataInput.locationId }
          },
          {
            model: ServiceModel,
            as: 'services',
            required: true,
            where: { id: { [Op.in]: dataInput.serviceIds } },
            attributes: []
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });
      if (!staffs) {
        throw new CustomError(staffErrorDetails.E_4000('staff not found'), HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return next(error);
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
      const rangeList: number[] = [];
      const dataInput = { ...req.body };
      const validateErrors = validate(dataInput.staffId, staffIdSchema);
      const workDay = dataInput.workDay;
      const serviceDuration = dataInput.serviceDuration;
      const durationTime = minutesToNum(serviceDuration);
      const timeZone = moment.parseZone(dataInput.currentTime).utcOffset();
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const workingTime = await StaffModel.scope('safe').findOne({
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
          rangeList.push(finalTimeSlot);
          Object.keys(timeSlot).forEach((key: any, index: any) => {
            const indexStart = Object.keys(timeSlot).indexOf(firstTime);
            const indexEndTime = Object.keys(timeSlot).indexOf(finTimeSlot);
            if (index < indexEndTime && index > indexStart) {
              timeSlot[key] = false;
            }
          });
        });
      }

      for (let i = 0; i < rangeList.length - 1; i++) {
        for (let k = 1; k < rangeList.length; k++) {
          if (i + 1 === k) {
            if (rangeList[k] - rangeList[i] <= durationTime) {
              let temp;
              while (rangeList[i] < rangeList[k]) {
                rangeList[i] = rangeList[i] + 5;
                if (rangeList[i] % 100 === 60) {
                  rangeList[i] = (Math.floor(rangeList[i] / 100) + 1) * 100;
                }
                temp = moment(rangeList[i], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
            const stringEndTime = moment(workTime.endTime.split(':').join(''), 'hmm')
              .add(-timeZone, 'm')
              .format('HH:mm');
            //let semiEndTime = moment();
            const endTime = parseInt(stringEndTime.split(':').join(''), 10);
            timeSlot[stringEndTime] = false;
            if (endTime - rangeList[k] < durationTime) {
              let temp;
              while (rangeList[k] < endTime) {
                rangeList[k] = rangeList[k] + 5;
                if (rangeList[k] % 100 === 60) {
                  rangeList[k] = (Math.floor(rangeList[k] / 100) + 1) * 100;
                }
                temp = moment(rangeList[k], 'hmm').format('HH:mm');
                timeSlot[temp] = false;
              }
            }
          }
        }
      }
      Object.keys(timeSlot).forEach((key: any) => {
        let temp;
        if (timeSlot[key] === true) {
          const stringEndTime = moment(workTime.endTime.split(':').join(''), 'hmm').add(-timeZone, 'm').format('HH:mm');
          const endTime = parseInt(stringEndTime.split(':').join(''), 10);
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
        throw new CustomError(staffErrorDetails.E_4000(`staffId ${dataInput.staffId} not found`), HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(buildSuccessMessage(newTimeSlot));
    } catch (error) {
      return next(error);
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

      const doctorsSchedule = await LocationModel.findAndCountAll({
        attributes: [],
        include: [
          {
            model: StaffModel,
            as: 'staffs',
            through: { attributes: [] },
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
            ]
          }
        ],
        where: {
          id: locationId
        }
      });
      const preDataFirst = JSON.stringify(doctorsSchedule);
      const preDataSecond = JSON.parse(preDataFirst);
      const len = preDataSecond.count;
      for (let i = 0; i < len; i++) {
        preDataSecond.rows[0].staffs[i].appointmentDetails.forEach((e: any) => {
          e.start_time = moment(e.start_time).format('HH:mm');
        });
      }
      const staffUnavailTime = getStaffUnavailTime(preDataSecond);
      const doctors = await LocationStaffModel.findAndCountAll({
        attributes: ['staff_id'],
        where: {
          location_id: locationId
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
   *   PositionStaffDetail:
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
   *           - locationId
   *           - listPositionStaff
   *       properties:
   *           locationId:
   *              type: string
   *           listPositionStaff:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/PositionStaffDetail'
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
    let transaction = null;
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(req.body.locationId)) {
        throw new CustomError(branchErrorDetails.E_1001(), HttpStatus.FORBIDDEN);
      }

      const dataInput = { ...req.body };
      const id = res.locals.staffPayload.id;
      const validateErrors = validate(dataInput, settingPositionStaffSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      const existPosition1 = await PositionModel.findOne({
        where: {
          ownerId: id,
          staffId: dataInput.listPositionStaff[0].staffId,
          index: dataInput.listPositionStaff[0].index,
          locationId: req.body.locationId
        }
      });

      const existPosition2 = await PositionModel.findOne({
        where: {
          ownerId: id,
          staffId: dataInput.listPositionStaff[1].staffId,
          index: dataInput.listPositionStaff[1].index,
          locationId: req.body.locationId
        }
      });

      if (!existPosition1 || !existPosition2) {
        throw new CustomError(staffErrorDetails.E_4013(), HttpStatus.BAD_REQUEST);
      }

      const temp = existPosition2.index;
      existPosition2.index = existPosition1.index;
      existPosition1.index = temp;

      transaction = await sequelize.transaction();

      await existPosition1.save({ transaction });
      await existPosition2.save({ transaction });
      await transaction.commit();

      res.status(HttpStatus.OK).send(buildSuccessMessage({ existPosition1, existPosition2 }));
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   *  @swagger
   * /staff/list-service/{staffId}:
   *   get:
   *     tags:
   *       - Staff
   *     name: getServicesByStaff
   *     parameters:
   *     - in: path
   *       name: staffId
   *       required: true
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

  public getServicesByStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.staffId, staffIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staff = await StaffModel.scope('safe').findOne({
        where: { id: req.params.staffId }
      });
      if (!staff) {
        throw new CustomError(
          staffErrorDetails.E_4000(`staff Id ${req.params.staffId} not found`),
          HttpStatus.NOT_FOUND
        );
      }
      let cateServices: any = [];
      cateServices = await CateServiceModel.findAndCountAll({
        include: [
          {
            model: ServiceModel,
            as: 'services',
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            separate: true,
            include: [
              {
                model: StaffModel,
                as: 'staffs',
                required: true,
                through: { attributes: [] },
                attributes: [],
                where: { id: req.params.staffId }
              }
            ]
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });
      // let listServices: any = [];
      // listServices = await StaffModel.findAll({
      //   include: [
      //     {
      //       model: ServiceModel,
      //       as: 'services',
      //       required: true,
      //       through: {attributes:[]},
      //       attributes:{exclude: ['createdAt','updatedAt','deletedAt']},
      //       include: [
      //         {
      //           model: CateServiceModel,
      //           as : 'cateService',
      //           required:true,
      //           attributes:{exclude: ['createdAt', 'updatedAt', 'deletedAt']}
      //         }
      //       ]
      //     }
      //   ],
      //   attributes: [],
      //   where: { id: req.params.staffId }
      // });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateServices));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/init-position-staff/{locationId}:
   *   post:
   *     tags:
   *       - Staff
   *     name: initPositionStaff
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
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
  public initPositionStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(req.params.locationId)) {
        throw new CustomError(branchErrorDetails.E_1001(), HttpStatus.FORBIDDEN);
      }
      const existLocationId = await PositionModel.findOne({ where: { locationId: req.params.locationId } });
      if (existLocationId) {
        throw new CustomError(staffErrorDetails.E_4012(), HttpStatus.BAD_REQUEST);
      }
      const staffs = await StaffModel.findAll({
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            required: true,
            where: { id: req.params.locationId }
          }
        ]
      });
      const dataPosition = staffs.map((x, index) => ({
        ownerId: res.locals.staffPayload.id,
        staffId: x.id,
        index: index,
        locationId: req.params.locationId
      }));
      await PositionModel.bulkCreate(dataPosition);
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
