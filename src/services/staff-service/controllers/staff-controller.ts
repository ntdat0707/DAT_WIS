//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
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
  LocationStaffModel
} from '../../../repositories/postgres/models';

import { staffIdSchema, createStaffSchema, filterStaffSchema, createStaffsSchema } from '../configs/validate-schemas';

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
   * definitions:
   *   staffCreate:
   *       required:
   *           - fullName
   *           - mainLocationId
   *           - workingLocationIds
   *       properties:
   *           mainLocationId:
   *               type: string
   *           fullName:
   *               type: string
   *           gender:
   *               type: integer
   *           phone:
   *               type: string
   *           birthDate:
   *               type: string
   *           passportNumber:
   *               type: string
   *           address:
   *               type: string
   *           workingLocationIds:
   *               type: array
   *               items:
   *                   type: string
   *
   *
   */

  /**
   * @swagger
   * /staff/create:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: updateStatus
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/staffCreate'
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
      const profile = {
        fullName: req.body.fullName,
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
      await StaffModel.create(profile, { transaction });
      if (req.body.workingLocationIds) {
        const workingLocationData = (req.body.workingLocationIds as []).map((x) => ({
          locationId: x,
          staffId: profile.id
        }));
        await LocationStaffModel.bulkCreate(workingLocationData, { transaction });
      }
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
   *           - fullName
   *       properties:
   *           fullName:
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
   *           - workingLocationIds
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
      transaction = await sequelize.transaction();
      const validateErrors = validate(req.body, createStaffsSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const profiles = [];
      for (let i = 0; i < req.body.staffDetails.length; i++) {
        const profile = {
          mainLocationId: req.body.mainLocationId,
          fullName: req.body.staffDetails[i].fullName,
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
      const staffs = await StaffModel.bulkCreate(profiles, { transaction });
      const workingLocationData = (staffs as []).map((x: any) => ({
        locationId: req.body.mainLocationId,
        staffId: x.id
      }));
      await LocationStaffModel.bulkCreate(workingLocationData, { transaction });
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
