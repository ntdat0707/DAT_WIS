//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import _ from 'lodash';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails, branchErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
import {
  sequelize,
  StaffModel,
  LocationModel,
  ServiceModel,
  LocationStaffModel,
  AppointmentModel,
  AppointmentDetailModel
} from '../../../repositories/postgres/models';

import {
  staffIdSchema,
  createStaffSchema,
  filterStaffSchema,
  createStaffsSchema,
  updateStaffSchema
} from '../configs/validate-schemas';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';

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
      const staff = await StaffModel.findOne({ where: { id: staffId } });
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
   *       name: workingLocationIds
   *       type: array
   *       required: true
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
   *       name: passportNumber
   *       type: string
   *     - in: "formData"
   *       name: workingLocationIds
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

      const handleServiceIds = await this.handleEditStaffServices(req.params.staffId, req.body.serviceIds);
      if (handleServiceIds.serviceIdsAdded.length) {
        await ServiceStaffModel.bulkCreate(
          handleServiceIds.serviceIdsAdded.map((serviceId) => ({ staffId: req.params.staffId, serviceId: serviceId })),
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
}
