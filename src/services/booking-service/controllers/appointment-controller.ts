import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import {
  branchErrorDetails,
  customerErrorDetails,
  bookingErrorDetails
} from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { EAppointmentStatus, AppointmentStatusRules } from '../../../utils/consts';
import {
  sequelize,
  StaffModel,
  ServiceModel,
  ResourceModel,
  CustomerModel,
  AppointmentDetailModel,
  AppointmentModel,
  LocationModel,
  AppointmentDetailStaffModel
} from '../../../repositories/postgres/models';

import {
  createAppointmentSchema,
  filterAppointmentDetailChema,
  updateAppointmentStatusSchema,
  appointmentCancelReasonSchema,
  updateAppointmentSchema,
  appointmentIdSchema
} from '../configs/validate-schemas';
import { BaseController } from './base-controller';
export class AppointmentController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   CreateAppointmentDetail:
   *       required:
   *           - serviceId
   *           - resourceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           serviceId:
   *               type: string
   *           resourceId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *
   */

  /**
   * @swagger
   * definitions:
   *   CreateAppointment:
   *       required:
   *           - locationId
   *           - date
   *           - appointmentDetails
   *       properties:
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */

  /**
   * @swagger
   * /booking/appointment/create-appointment:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: createAppointment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateAppointment'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server errors
   */
  /**
   *  Steps:
   *    1. Validate format body data
   *    2. Check customer exist
   *    3. Check Servcie, staff, resource match input data
   *    4. create appointment and appoitnment detail
   */
  public createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dataInput = {
        locationId: req.body.locationId,
        customerId: req.body.customerId,
        date: req.body.date,
        appointmentDetails: req.body.appointmentDetails
      };
      //validate req.body
      const validateErrors = validate(dataInput, createAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      // Check location
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      if (!workingLocationIds.includes(dataInput.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${dataInput.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }

      if (dataInput.customerId) {
        const customer = await CustomerModel.findOne({ where: { id: dataInput.customerId, companyId } });
        if (!customer) {
          return next(
            new CustomError(
              customerErrorDetails.E_3001(
                `Can not find customer ${dataInput.customerId} in location ${dataInput.locationId}`
              ),
              HttpStatus.BAD_REQUEST
            )
          );
        }
      }
      const appointmentId = uuidv4();
      const appointmentDetails = await this.verifyAppointmentDetails(
        dataInput.appointmentDetails,
        dataInput.locationId
      );
      if (appointmentDetails instanceof CustomError) return next(appointmentDetails);
      //insert appointment here
      const appointmentData = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerId: dataInput.customerId ? dataInput.customerId : null
      };
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentModel.create(appointmentData, { transaction });

      const appointmentDetailData: any[] = [];
      const appointmentDetailStaffData = [];
      const staffDataNotify: { ids: string[]; time: { start: Date; end?: Date } }[] = [];
      const resourceDataNotify: { id: string; time: { start: Date; end?: Date } }[] = [];
      const serviceDataNotify: { id: string; time: { start: Date; end?: Date } }[] = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        serviceDataNotify.push({
          id: appointmentDetails[i].serviceId,
          time: {
            start: appointmentDetails[i].startTime,
            end: moment(appointmentDetails[i].startTime).add(appointmentDetails[i].duration, 'minutes').toDate()
          }
        });
        if (appointmentDetails[i].resourceId)
          resourceDataNotify.push({
            id: appointmentDetails[i].resourceId,
            time: {
              start: appointmentDetails[i].startTime,
              end: moment(appointmentDetails[i].startTime).add(appointmentDetails[i].duration, 'minutes').toDate()
            }
          });
        staffDataNotify.push({
          ids: appointmentDetails[i].staffIds,
          time: {
            start: appointmentDetails[i].startTime,
            end: moment(appointmentDetails[i].startTime).add(appointmentDetails[i].duration, 'minutes').toDate()
          }
        });
        const appointmentDetailId = uuidv4();
        appointmentDetailData.push({
          id: appointmentDetailId,
          appointmentId,
          serviceId: appointmentDetails[i].serviceId,
          resourceId: appointmentDetails[i].resourceId ? appointmentDetails[i].resourceId : null,
          startTime: appointmentDetails[i].startTime
        });
        for (let j = 0; j < appointmentDetails[i].staffIds.length; j++) {
          appointmentDetailStaffData.push({
            appointmentDetailId,
            staffId: appointmentDetails[i].staffIds[j]
          });
        }
      }
      await AppointmentDetailModel.bulkCreate(appointmentDetailData, {
        transaction
      });
      await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
      const findQuery: FindOptions = {
        where: { id: appointmentId },
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            include: [
              {
                model: ServiceModel,
                as: 'service'
              },
              {
                model: ResourceModel,
                as: 'resource'
              },
              {
                model: StaffModel.scope('safe'),
                as: 'staffs',
                through: { attributes: [] }
              }
            ]
          }
        ],
        transaction
      };
      if (dataInput.customerId)
        findQuery.include.push({
          model: CustomerModel,
          as: 'customer'
        });
      const appointmentStoraged = await AppointmentModel.findOne(findQuery);
      await this.pushNotifyLockAppointmentData({
        locationId: appointmentData.locationId,
        serviceData: serviceDataNotify,
        resourceData: resourceDataNotify,
        staffData: staffDataNotify
      });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentStoraged));
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
   * /booking/appointment/get-all-appointment-details:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAllAppointmentDetails
   *     parameters:
   *     - in: query
   *       name: locationId
   *       schema:
   *          type: string
   *     - in: query
   *       name: startTime
   *       description: YYY-MM-DD HH:mm:ss
   *       schema:
   *          type: string
   *          format: date-time
   *     - in: query
   *       name: endTime
   *       description: YYY-MM-DD HH:mm:ss
   *       schema:
   *          type: string
   *          format: date-time
   *     - in: query
   *       name: staffIds
   *       schema:
   *           type: array
   *           items:
   *               type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public getAllAppointmentDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conditions = {
        locationId: req.query.locationId,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        staffIds: req.query.staffIds
      };
      const validateErrors = validate(conditions, filterAppointmentDetailChema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(conditions.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${conditions.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const query: FindOptions = {
        where: { id: { [Op.ne]: null } },
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { locationId: conditions.locationId },
            include: [
              {
                model: LocationModel,
                as: 'location',
                required: true
              },
              {
                model: CustomerModel,
                as: 'customer',
                required: false
              }
            ]
          },
          {
            model: ServiceModel,
            as: 'service',
            required: true
          },
          {
            model: ResourceModel,
            as: 'resource'
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ]
      };

      let conditionStartTime = {};
      if (conditions.startTime) conditionStartTime = { ...conditionStartTime, ...{ [Op.gte]: conditions.startTime } };
      if (conditions.endTime) conditionStartTime = { ...conditionStartTime, ...{ [Op.lte]: conditions.endTime } };
      if (conditionStartTime.constructor === Object && Object.getOwnPropertySymbols(conditionStartTime).length > 0) {
        query.where = {
          ...query.where,
          ...{ startTime: conditionStartTime }
        };
      }
      const conditionsStaffs: any = conditions.staffIds
        ? {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] },
            where: { id: conditions.staffIds }
          }
        : {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          };
      query.include = {
        ...query.include,
        ...conditionsStaffs
      };
      const appointmentDetails = await AppointmentDetailModel.findAll(query);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetails));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentStatus:
   *       required:
   *           - appointmentId
   *           - status
   *       properties:
   *           appointmentId:
   *               type: string
   *           status:
   *               type: string
   *               enum: [new, confirmed, arrived, in_service, completed, cancel]
   *           cancelReason:
   *               type: string
   *               description: only accept with status cancel
   *
   */
  /**
   * @swagger
   * /booking/appointment/update-appointment-status:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAllAppointmentDetails
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateAppointmentStatus'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: FORBIDDEN
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = { appointmentId: req.body.appointmentId, status: req.body.status };
      const validateErrors = validate(data, updateAppointmentStatusSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointment = await AppointmentModel.findOne({
        where: { id: data.appointmentId, locationId: workingLocationIds }
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${data.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (!workingLocationIds.includes(appointment.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${appointment.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const isValidStatus =
        AppointmentStatusRules[appointment.status as EAppointmentStatus][data.status as EAppointmentStatus];
      if (!isValidStatus) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2003(
              `Can not update appointment status from ${appointment.status} to  ${data.status}`
            ),
            HttpStatus.NOT_FOUND
          )
        );
      }
      // start transaction
      transaction = await sequelize.transaction();
      if (data.status === EAppointmentStatus.CANCEL) {
        const validateReasonErrors = validate(req.body.cancelReason, appointmentCancelReasonSchema);
        if (validateReasonErrors) {
          return next(new CustomError(validateReasonErrors, HttpStatus.BAD_REQUEST));
        }
        await AppointmentModel.update(
          { status: data.status, cancelReason: req.body.cancelReason },
          { where: { id: data.appointmentId, locationId: workingLocationIds }, transaction }
        );
        await AppointmentDetailModel.update(
          { status: data.status },
          { where: { appointmentId: data.appointmentId }, transaction }
        );
      } else {
        await AppointmentModel.update(
          { status: data.status },
          { where: { id: data.appointmentId, locationId: workingLocationIds }, transaction }
        );
        await AppointmentDetailModel.update(
          { status: data.status },
          { where: { appointmentId: data.appointmentId }, transaction }
        );
      }
      const newAppointmentStatus = await AppointmentModel.findOne({
        where: { id: data.appointmentId, locationId: workingLocationIds },
        transaction
      });
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(newAppointmentStatus));
    } catch (error) {
      if (transaction) {
        //rollback transaction
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateAppointment:
   *       required:
   *           - appointmentId
   *           - locationId
   *           - date
   *       properties:
   *           appointmentId:
   *               type: string
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *
   */
  /**
   * @swagger
   * /booking/appointment/update-appointment:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: updateAppointment
   *     description: Nếu thay đổi location các appointmentDetail sẽ bị xóa
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateAppointment'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: FORBIDDEN
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      const data = {
        locationId: req.body.locationId,
        date: req.body.date,
        customerId: req.body.customerId,
        appointmentId: req.body.appointmentId
      };

      const validateErrors = validate(data, updateAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      if (!workingLocationIds.includes(data.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${data.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const appointment = await AppointmentModel.findOne({ where: { id: data.appointmentId } });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${data.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      // Check customer exist
      if (data.customerId) {
        const customer = await CustomerModel.findOne({ where: { id: data.customerId, companyId } });
        if (!customer) {
          return next(
            new CustomError(
              customerErrorDetails.E_3001(`Can not find customer ${data.customerId} in location ${data.locationId}`),
              HttpStatus.BAD_REQUEST
            )
          );
        }
      }
      // start transaction
      transaction = await sequelize.transaction();
      if (data.locationId !== appointment.locationId) {
        // If change location, appointment details would be delete
        await AppointmentDetailModel.destroy({ where: { appointmentId: data.appointmentId } });
      }
      await AppointmentModel.update(data, { where: { id: data.appointmentId } });
      const findQuery: FindOptions = {
        where: { id: data.appointmentId },
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            include: [
              {
                model: ServiceModel,
                as: 'service'
              },
              {
                model: ResourceModel,
                as: 'resource'
              },
              {
                model: StaffModel.scope('safe'),
                as: 'staffs',
                through: { attributes: [] }
              }
            ]
          }
        ],
        transaction
      };
      if (data.customerId)
        findQuery.include.push({
          model: CustomerModel,
          as: 'customer'
        });
      const appointmentStoraged = await AppointmentModel.findOne(findQuery);
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentStoraged));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment/delete-appointment/{appointmentId}:
   *   delete:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: deleteAppointment
   *     parameters:
   *     - in: path
   *       name: appointmentId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: FORBIDDEN
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.params.appointmentId, appointmentIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentStoraged = await AppointmentModel.findOne({
        where: { id: req.params.appointmentId, locationId: workingLocationIds }
      });
      if (!appointmentStoraged) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${req.params.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentDetailModel.destroy({ where: { appointmentId: req.params.appointmentId }, transaction });
      await AppointmentModel.destroy({ where: { id: req.params.appointmentId }, transaction });
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment/get-appointment/{appointmentId}:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAppointment
   *     parameters:
   *     - in: path
   *       name: appointmentId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: FORBIDDEN
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public getAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.appointmentId, appointmentIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointment = await AppointmentModel.findOne({
        where: { id: req.params.appointmentId, locationId: workingLocationIds },
        include: [
          {
            model: LocationModel,
            as: 'location',
            required: true
          },
          {
            model: CustomerModel,
            as: 'customer'
          },
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            include: [
              {
                model: ServiceModel,
                as: 'service',
                required: true
              },
              {
                model: ResourceModel,
                as: 'resource'
              },
              {
                model: StaffModel.scope('safe'),
                as: 'staffs'
              }
            ]
          }
        ]
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${req.params.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointment));
    } catch (error) {
      return next(error);
    }
  };
}
