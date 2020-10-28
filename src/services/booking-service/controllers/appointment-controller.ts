import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op, Sequelize } from 'sequelize';
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
import { EAppointmentStatus, AppointmentStatusRules, AppointmentBookingSource } from '../../../utils/consts';
import {
  sequelize,
  StaffModel,
  ServiceModel,
  ResourceModel,
  CustomerModel,
  AppointmentDetailModel,
  AppointmentModel,
  LocationModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  CustomerWisereModel,
  RecentBookingModel,
  DealModel,
  PipelineModel,
  PipelineStageModel
} from '../../../repositories/postgres/models';

import {
  createAppointmentSchema,
  filterAppointmentDetailChema,
  updateAppointmentStatusSchema,
  appointmentCancelReasonSchema,
  updateAppointmentSchema,
  appointmentIdSchema,
  customerCreateAppointmentSchema,
  appointmentCancelSchema,
  appointmentRescheduleSchema,
  ratingAppointmentSchema
} from '../configs/validate-schemas';
import { BaseController } from './base-controller';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import httpStatus from 'http-status';
import { IRequestOptions, request } from '../../../utils/request';
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
   *           - bookingSource
   *           - date
   *           - appointmentDetails
   *       properties:
   *           locationId:
   *               type: string
   *           bookingSource:
   *               type: string
   *           customerWisereId:
   *               type: string
   *           appointmentGroupId:
   *               type: string
   *           relatedAppointmentId:
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
   *         description: Bad request - input invalid format, header is invalid
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server errors
   */
  /**
   *  Steps:
   *    1. Validate format body data
   *    2. Check customer exist
   *    3. Check service, staff, resource match input data
   *    4. create appointment and appointment detail
   */
  public createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dataInput = {
        locationId: req.body.locationId,
        customerWisereId: req.body.customerWisereId,
        date: req.body.date,
        appointmentDetails: req.body.appointmentDetails,
        bookingSource: req.body.bookingSource,
        appointmentGroupId: req.body.appointmentGroupId,
        relatedAppointmentId: req.body.relatedAppointmentId
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

      if (dataInput.customerWisereId) {
        const customerWisere = await CustomerWisereModel.findOne({
          where: { id: dataInput.customerWisereId, companyId }
        });
        if (!customerWisere) {
          return next(
            new CustomError(
              customerErrorDetails.E_3001(
                `Can not find customerWisere ${dataInput.customerWisereId} in location ${dataInput.locationId}`
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
      let appointmentCode = '';
      while (true) {
        const random = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 8);
        const randomCode = random.toUpperCase();
        appointmentCode = randomCode;
        const existAppCode = await AppointmentModel.findOne({
          where: {
            appointmentCode: appointmentCode
          }
        });
        if (!existAppCode) {
          break;
        }
      }
      //insert appointment here
      const appointmentData: any = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerWisereId: dataInput.customerWisereId ? dataInput.customerWisereId : null,
        bookingSource: dataInput.bookingSource,
        appointmentCode: appointmentCode,
        date: dataInput.date
      };

      if (dataInput.appointmentGroupId) {
        const appointmentGroup = await AppointmentGroupModel.findOne({
          where: {
            id: dataInput.appointmentGroupId
          }
        });

        if (!appointmentGroup) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2007(`appointment group ${dataInput.appointmentGroupId} not found`),
              HttpStatus.NOT_FOUND
            )
          );
        }
        appointmentData.appointmentGroupId = dataInput.appointmentGroupId;
      }

      // start transaction
      transaction = await sequelize.transaction();
      if (dataInput.relatedAppointmentId) {
        const appointment = await AppointmentModel.findOne({
          where: {
            id: dataInput.relatedAppointmentId
          }
        });

        if (!appointment) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2002(`appointment ${dataInput.relatedAppointmentId} not found`),
              HttpStatus.NOT_FOUND
            )
          );
        }
        const appointmentGroupId = uuidv4();
        appointmentData.appointmentGroupId = appointmentGroupId;
        await AppointmentModel.update(
          { appointmentGroupId: appointmentGroupId },
          { where: { id: dataInput.relatedAppointmentId }, transaction }
        );
      }
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
          startTime: appointmentDetails[i].startTime,
          duration: appointmentDetails[i].duration
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
      // const findQuery: FindOptions = {
      //   where: { id: appointmentId },
      //   include: [
      //     {
      //       model: AppointmentDetailModel,
      //       as: 'appointmentDetails',
      //       include: [
      //         {
      //           model: ServiceModel,
      //           as: 'service'
      //         },
      //         {
      //           model: ResourceModel,
      //           as: 'resource'
      //         },
      //         {
      //           model: StaffModel.scope('safe'),
      //           as: 'staffs',
      //           through: { attributes: [] }
      //         }
      //       ]
      //     }
      //   ],
      //   transaction
      // };
      // if (dataInput.customerId)
      //   findQuery.include.push({
      //     model: CustomerModel,
      //     as: 'customer'
      //   });
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { id: appointmentId },
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
                required: false
              },
              {
                model: AppointmentGroupModel,
                as: 'appointmentGroup',
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
            as: 'resource',
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ],
        transaction
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listAppointmentDetail);
      if (listAppointmentDetail[0].appointment.customerWisere) {
        await this.convertApptToDeal(listAppointmentDetail, companyId, res.locals.staffPayload.id, transaction);
      }
      //commit transaction
      await transaction.commit();
      const isPortReachable = require('is-port-reachable');
      const isLiveHost = await isPortReachable(3000, { host: '10.104.0.8' });
      if (isLiveHost) {
        const options: IRequestOptions = {
          url: 'http://10.104.0.8:3000/appointment/create-cron-job-auto-update-status',
          method: 'post',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({ appointmentId: appointmentId })
        };
        await request(options);
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(listAppointmentDetail));
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
   *     - in: query
   *       name: resourceIds
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
        staffIds: req.query.staffIds,
        resourceIds: req.query.resourceIds
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
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
      const conditionResources: any = conditions.resourceIds
        ? {
            model: ResourceModel,
            as: 'resource',
            required: false,
            where: { id: conditions.resourceIds }
          }
        : {
            model: ResourceModel,
            as: 'resource',
            required: false
          };
      query.include.push(conditionsStaffs);
      query.include.push(conditionResources);
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
   *     name: updateAppointmentStatus
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
          if (transaction) {
            await transaction.rollback();
          }
          return next(new CustomError(validateReasonErrors, HttpStatus.BAD_REQUEST));
        }
        await AppointmentModel.update(
          { status: data.status, cancelReason: req.body.cancelReason, isPrimary: false },
          { where: { id: data.appointmentId, locationId: workingLocationIds }, transaction }
        );

        if (appointment.appointmentGroupId && appointment.isPrimary) {
          const appointmentInGroup = await AppointmentModel.findOne({
            where: {
              appointmentGroupId: appointment.appointmentGroupId,
              id: { [Op.not]: data.appointmentId }
            }
          });
          if (appointmentInGroup) {
            await AppointmentModel.update({ isPrimary: true }, { where: { id: appointmentInGroup.id }, transaction });
          }
        }
      } else {
        await AppointmentModel.update(
          { status: data.status },
          { where: { id: data.appointmentId, locationId: workingLocationIds }, transaction }
        );
      }
      const newAppointmentStatus = await AppointmentModel.findOne({
        where: { id: data.appointmentId, locationId: workingLocationIds },
        transaction
      });
      //commit transaction
      await transaction.commit();
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { id: data.appointmentId },
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
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
            as: 'resource',
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ]
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyEditAppointmentData(listAppointmentDetail);
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
   *   CreateNewAppointmentDetail:
   *       required:
   *           - serviceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           resourceId:
   *               type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           serviceId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentDetail:
   *       required:
   *           - appointmentDetailId
   *       properties:
   *           appointmentDetailId:
   *               type: string
   *           resourceId:
   *               type: string
   *           serviceId:
   *               type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateNewAppointment:
   *       required:
   *           - appointmentDetails
   *       properties:
   *           customerWisereId:
   *               type: string
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */
  /**
   * @swagger
   * definitions:
   *   UpdateAppointment:
   *       properties:
   *           customerWisereId:
   *               type: string
   *           locationId:
   *               type: string
   *           bookingSource:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           createNewAppointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateNewAppointmentDetail'
   *           updateAppointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/UpdateAppointmentDetail'
   *           deleteAppointmentDetails:
   *               type: array
   *               items:
   *                   type: string
   *           createNewAppointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateNewAppointment'
   *
   */
  /**
   * @swagger
   * /booking/appointment/update-appointment/{appointmentId}:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: updateAppointment
   *     description: Nếu thay đổi location các appointmentDetail sẽ bị xóa
   *     parameters:
   *     - in: path
   *       name: appointmentId
   *       required: true
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
        appointmentId: req.params.appointmentId,
        createNewAppointmentDetails: req.body.createNewAppointmentDetails,
        updateAppointmentDetails: req.body.updateAppointmentDetails,
        deleteAppointmentDetails: req.body.deleteAppointmentDetails,
        createNewAppointments: req.body.createNewAppointments,
        customerWisereId: req.body.customerWisereId,
        date: req.body.date,
        bookingSource: req.body.bookingSource
      };

      const validateErrors = validate(data, updateAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { companyId } = res.locals.staffPayload;

      const appointment = await AppointmentModel.findOne({ where: { id: data.appointmentId } });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${data.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }

      if (data.locationId !== appointment.locationId) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2008(`Location ${data.locationId} incorrect in appointment ${data.appointmentId}`),
            HttpStatus.BAD_REQUEST
          )
        );
      }
      // Check customer wisere exist
      if (data.customerWisereId) {
        if (appointment.bookingSource === AppointmentBookingSource.MARKETPLACE) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2009(
                `Customer wisere ${data.customerWisereId} disallow update in appointment ${data.appointmentId}`
              ),
              HttpStatus.BAD_REQUEST
            )
          );
        }
        const customerWisere = await CustomerWisereModel.findOne({ where: { id: data.customerWisereId, companyId } });
        if (!customerWisere) {
          return next(
            new CustomError(
              customerErrorDetails.E_3001(
                `Can not find customerWisere ${data.customerWisereId} in location ${data.locationId}`
              ),
              HttpStatus.BAD_REQUEST
            )
          );
        }
      }
      // start transaction
      transaction = await sequelize.transaction();

      let appointmentGroupId = null;
      const appointmentIds = [];
      if (appointment.date !== data.date) {
        appointmentIds.push(appointment.id);
      }
      if (data.createNewAppointments && data.createNewAppointments.length > 0) {
        appointmentGroupId = uuidv4();
        await AppointmentGroupModel.create(
          { id: appointmentGroupId, locationId: data.locationId, date: data.date },
          { transaction }
        );
        for (let i = 0; i < data.createNewAppointments.length; i++) {
          if (data.createNewAppointments[i].customerWisereId) {
            const customerWisere = await CustomerWisereModel.findOne({
              where: { id: data.createNewAppointments[i].customerWisereId, companyId }
            });
            if (!customerWisere) {
              return next(
                new CustomError(
                  customerErrorDetails.E_3001(
                    `Can not find customerWisere ${data.createNewAppointments[i].customerWisereId} in location ${data.locationId}`
                  ),
                  HttpStatus.BAD_REQUEST
                )
              );
            }
            const appointmentId = uuidv4();
            appointmentIds.push(appointmentId);
            const appointmentDetails = await this.verifyAppointmentDetails(
              data.createNewAppointments[i].appointmentDetails,
              data.locationId
            );
            let appointmentCode = '';
            while (true) {
              const random = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 8);
              const randomCode = random.toUpperCase();
              appointmentCode = randomCode;
              const existAppCode = await AppointmentModel.findOne({
                where: {
                  appointmentCode: appointmentCode
                }
              });
              if (!existAppCode) {
                break;
              }
            }
            //insert appointment here
            const newAppointmentData: any = {
              id: appointmentId,
              locationId: data.locationId,
              status: EAppointmentStatus.NEW,
              customerWisereId: data.createNewAppointments[i].customerWisereId
                ? data.createNewAppointments[i].customerWisereId
                : null,
              bookingSource: req.body.bookingSource,
              appointmentGroupId: appointmentGroupId,
              isPrimary: false,
              date: data.date,
              appointmentCode: appointmentCode
            };
            await AppointmentModel.create(newAppointmentData, { transaction });
            const appointmentDetailData: any[] = [];
            const appointmentDetailStaffData = [];
            for (let index = 0; index < appointmentDetails.length; index++) {
              const appointmentDetailId = uuidv4();
              appointmentDetailData.push({
                id: appointmentDetailId,
                appointmentId,
                serviceId: appointmentDetails[index].serviceId,
                resourceId: appointmentDetails[index].resourceId ? appointmentDetails[index].resourceId : null,
                startTime: appointmentDetails[index].startTime,
                duration: appointmentDetails[index].duration
              });
              for (let j = 0; j < appointmentDetails[index].staffIds.length; j++) {
                appointmentDetailStaffData.push({
                  appointmentDetailId,
                  staffId: appointmentDetails[index].staffIds[j]
                });
              }
            }
            await AppointmentDetailModel.bulkCreate(appointmentDetailData, {
              transaction
            });
            await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
          }
        }
      }

      //update appointment here
      const appointmentData: any = {
        date: data.date,
        customerWisereId: data.customerWisereId ? data.customerWisereId : appointment.customerWisereId,
        appointmentGroupId: appointmentGroupId
      };
      await AppointmentModel.update(appointmentData, { where: { id: data.appointmentId }, transaction });

      if (data.createNewAppointmentDetails && data.createNewAppointmentDetails.length > 0) {
        const appointmentDetails = await this.verifyAppointmentDetails(
          data.createNewAppointmentDetails,
          data.locationId
        );
        const appointmentDetailData: any[] = [];
        const appointmentDetailStaffData = [];
        for (let i = 0; i < appointmentDetails.length; i++) {
          const appointmentDetailId = uuidv4();
          appointmentDetailData.push({
            id: appointmentDetailId,
            appointmentId: data.appointmentId,
            serviceId: appointmentDetails[i].serviceId,
            resourceId: appointmentDetails[i].resourceId ? appointmentDetails[i].resourceId : null,
            startTime: appointmentDetails[i].startTime,
            duration: appointmentDetails[i].duration
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
      }
      if (data.updateAppointmentDetails && data.updateAppointmentDetails.length > 0) {
        for (let i = 0; i < data.updateAppointmentDetails.length; i++) {
          const appointmentDetail = await AppointmentDetailModel.findOne({
            where: {
              id: data.updateAppointmentDetails[i].appointmentDetailId,
              appointmentId: data.appointmentId
            }
          });

          if (!appointmentDetail) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2004(
                  `Appointment detail ${data.updateAppointmentDetails[i].appointmentDetailId} not exist`
                ),
                HttpStatus.NOT_FOUND
              )
            );
          }
          await AppointmentDetailModel.destroy({
            where: { id: data.updateAppointmentDetails[i].appointmentDetailId },
            transaction
          });
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: data.updateAppointmentDetails[i].appointmentDetailId },
            transaction
          });
        }
        const appointmentDetailData: any[] = [];
        const appointmentDetailStaffData = [];
        const appointmentDetails = await this.verifyAppointmentDetails(data.updateAppointmentDetails, data.locationId);
        for (let i = 0; i < appointmentDetails.length; i++) {
          const appointmentDetailId = uuidv4();
          appointmentDetailData.push({
            id: appointmentDetailId,
            appointmentId: data.appointmentId,
            serviceId: appointmentDetails[i].serviceId,
            resourceId: appointmentDetails[i].resourceId ? appointmentDetails[i].resourceId : null,
            startTime: appointmentDetails[i].startTime,
            duration: appointmentDetails[i].duration
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
      }
      if (data.deleteAppointmentDetails && data.deleteAppointmentDetails.length > 0) {
        for (let i = 0; i < data.deleteAppointmentDetails.length; i++) {
          const appointmentDetail = await AppointmentDetailModel.findOne({
            where: {
              id: data.deleteAppointmentDetails[i],
              appointmentId: data.appointmentId
            }
          });

          if (!appointmentDetail) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2004(`Appointment detail ${data.deleteAppointmentDetails[i]} not exist`),
                HttpStatus.NOT_FOUND
              )
            );
          }
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: data.deleteAppointmentDetails[i] },
            transaction
          });
          await AppointmentDetailModel.destroy({
            where: { id: data.deleteAppointmentDetails[i] },
            transaction
          });
        }
      }
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { id: data.appointmentId },
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
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
            as: 'resource',
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ],
        transaction
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listAppointmentDetail);
      await transaction.commit();
      //commit transaction
      const isPortReachable = require('is-port-reachable');
      const isLiveHost = await isPortReachable(3000, { host: '10.104.0.8' });
      if (isLiveHost) {
        for (let i = 0; i < appointmentIds.length; i++) {
          const options: IRequestOptions = {
            url: 'http://10.104.0.8:3000/appointment/create-cron-job-auto-update-status',
            method: 'post',
            headers: {
              accept: '*/*',
              'Content-Type': 'application/json'
            },
            data: JSON.stringify({ appointmentId: appointmentIds[i] })
          };
          await request(options);
        }
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(listAppointmentDetail));
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
            as: 'customer',
            required: false
          },
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false
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

  /**
   * @swagger
   * definitions:
   *   CustomerCreateAppointmentDetail:
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
   *   CustomerCreateAppointment:
   *       required:
   *           - locationId
   *           - date
   *           - appointmentDetails
   *       properties:
   *           locationId:
   *               type: string
   *           appointmentGroupId:
   *               type: string
   *           relatedAppointmentId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CustomerCreateAppointmentDetail'
   *
   */

  /**
   * @swagger
   * /booking/appointment/customer-create-appointment:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: customerCreateAppointment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CustomerCreateAppointment'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server errors
   */
  /**
   *  Steps:
   *    1. Validate format body data
   *    2. Check customer exist
   *    3. Check service, staff, resource match input data
   *    4. create appointment and appointment detail
   */
  public customerCreateAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dataInput = {
        locationId: req.body.locationId,
        date: req.body.date,
        appointmentDetails: req.body.appointmentDetails,
        bookingSource: AppointmentBookingSource.MARKETPLACE,
        appointmentGroupId: req.body.appointmentGroupId,
        relatedAppointmentId: req.body.relatedAppointmentId
      };
      //validate req.body
      const validateErrors = validate(dataInput, customerCreateAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      const location = await LocationModel.findOne({
        where: {
          id: dataInput.locationId
        }
      });

      if (!location) {
        return next(
          new CustomError(
            locationErrorDetails.E_1000(`Can not find location ${dataInput.locationId}`),
            HttpStatus.BAD_REQUEST
          )
        );
      }

      const { id } = res.locals.customerPayload;
      const appointmentId = uuidv4();
      const appointmentDetails = await this.verifyAppointmentDetails(
        dataInput.appointmentDetails,
        dataInput.locationId
      );
      let appointmentCode = '';
      for (let i = 0; i < 10; i++) {
        const random = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 8);
        const randomCode = random.toUpperCase();
        appointmentCode = randomCode;
        const existAppCode = await AppointmentModel.findOne({
          where: {
            appointmentCode: appointmentCode
          }
        });
        if (!existAppCode) {
          break;
        }
      }
      //insert appointment here
      const appointmentData: any = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerId: id,
        bookingSource: dataInput.bookingSource,
        appointmentCode: appointmentCode,
        date: dataInput.date
      };

      if (dataInput.appointmentGroupId) {
        const appointmentGroup = await AppointmentGroupModel.findOne({
          where: {
            id: dataInput.appointmentGroupId
          }
        });

        if (!appointmentGroup) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2007(`appointment group ${dataInput.appointmentGroupId} not found`),
              HttpStatus.NOT_FOUND
            )
          );
        }
        appointmentData.appointmentGroupId = dataInput.appointmentGroupId;
      }

      // start transaction
      transaction = await sequelize.transaction();
      if (dataInput.relatedAppointmentId) {
        const appointment = await AppointmentModel.findOne({
          where: {
            id: dataInput.relatedAppointmentId
          }
        });

        if (!appointment) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2002(`appointment ${dataInput.relatedAppointmentId} not found`),
              HttpStatus.NOT_FOUND
            )
          );
        }
        const appointmentGroupId = uuidv4();
        appointmentData.appointmentGroupId = appointmentGroupId;
        await AppointmentModel.update(
          { appointmentGroupId: appointmentGroupId },
          { where: { id: dataInput.relatedAppointmentId }, transaction }
        );
      }
      await AppointmentModel.create(appointmentData, { transaction });

      const appointmentDetailData: any[] = [];
      const appointmentDetailStaffData = [];
      // const staffDataNotify: { ids: string[]; time: { start: Date; end?: Date } }[] = [];
      // const resourceDataNotify: { id: string; time: { start: Date; end?: Date } }[] = [];
      // const serviceDataNotify: { id: string; time: { start: Date; end?: Date } }[] = [];
      const recentBookingData: any = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        const appointmentDetailId = uuidv4();
        appointmentDetailData.push({
          id: appointmentDetailId,
          appointmentId,
          serviceId: appointmentDetails[i].serviceId,
          resourceId: appointmentDetails[i].resourceId ? appointmentDetails[i].resourceId : null,
          startTime: appointmentDetails[i].startTime,
          duration: appointmentDetails[i].duration
        });
        for (let j = 0; j < appointmentDetails[i].staffIds.length; j++) {
          appointmentDetailStaffData.push({
            appointmentDetailId,
            staffId: appointmentDetails[i].staffIds[j]
          });
        }
        recentBookingData.push({
          id: uuidv4(),
          customerId: id,
          appointmentId,
          locationId: dataInput.locationId,
          serviceId: appointmentDetails[i].serviceId,
          staffId: appointmentDetails[i].staffIds[0]
        });
      }
      await AppointmentDetailModel.bulkCreate(appointmentDetailData, {
        transaction
      });
      await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
      await RecentBookingModel.bulkCreate(recentBookingData, { transaction });

      // const findQuery: FindOptions = {
      //   where: { id: appointmentId },
      //   include: [
      //     {
      //       model: AppointmentDetailModel,
      //       as: 'appointmentDetails',
      //       include: [
      //         {
      //           model: ServiceModel,
      //           as: 'service'
      //         },
      //         {
      //           model: ResourceModel,
      //           as: 'resource'
      //         },
      //         {
      //           model: StaffModel.scope('safe'),
      //           as: 'staffs',
      //           through: { attributes: [] }
      //         }
      //       ]
      //     }
      //   ],
      //   transaction
      // };
      // if (dataInput.customerId)
      //   findQuery.include.push({
      //     model: CustomerModel,
      //     as: 'customer'
      //   });
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { id: appointmentId },
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
            as: 'resource',
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ],
        transaction
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listAppointmentDetail);
      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(listAppointmentDetail));
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  public async convertApptToDeal(listAppointmentDetail: any, companyId: any, staffId: any, transaction: any) {
    const dataDeal: any = new DealModel();
    const appointment = listAppointmentDetail[0].appointment;
    const title =
      'Appt on ' +
      appointment.date.getDate() +
      (appointment.date.getMonth() + 1) +
      '•' +
      appointment.customerWisere.phone;
    dataDeal.setDataValue('dealTitle', title);
    dataDeal.setDataValue('source', appointment.bookingSource);
    dataDeal.setDataValue('customerWisereId', appointment.customerWisere.id);
    dataDeal.setDataValue('appointmentId', appointment.id);
    dataDeal.setDataValue('expectedCloseDate', appointment.date);
    let amount = 0;
    listAppointmentDetail.forEach((appointmentDetail: any) => {
      amount += appointmentDetail.service.salePrice;
    });
    dataDeal.setDataValue('amount', amount);
    dataDeal.setDataValue('currency', 'VND');
    const pipeline: any = await PipelineModel.findOne({
      where: { companyId: companyId, name: 'Appointment' },
      include: [
        {
          model: PipelineStageModel,
          as: 'pipelineStages',
          where: { order: '1' }
        }
      ]
    });
    if (pipeline) {
      dataDeal.setDataValue('pipelineStageId', pipeline.pipelineStages[0].id);
      dataDeal.setDataValue('createdBy', staffId);
      await DealModel.create(dataDeal.dataValues, transaction);
    }
  }

  /**
   * @swagger
   * /booking/appointment/customer-get-all-my-appointment:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAllMyAppointment
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllMyAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      const queryUpcomingAppt: FindOptions = {
        attributes: ['id', 'status', 'customerId'],
        where: {
          customerId: customerId,
          bookingSource: AppointmentBookingSource.MARKETPLACE,
          status: {
            [Op.and]: [
              { [Op.ne]: EAppointmentStatus.CANCEL },
              { [Op.ne]: EAppointmentStatus.COMPLETED },
              { [Op.ne]: EAppointmentStatus.NO_SHOW }
            ]
          }
        },
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            attributes: ['id', 'startTime'],
            include: [
              {
                model: ServiceModel,
                as: 'service',
                attributes: ['id', 'cateServiceId', 'description', 'duration', 'name', 'salePrice'],
                required: false
              },
              {
                model: StaffModel,
                as: 'staffs',
                attributes: ['id', 'firstName', 'avatarPath'],
                required: false,
                through: { attributes: [] }
              }
            ]
          },
          {
            model: LocationModel,
            as: 'location',
            attributes: ['id', 'name', 'address'],
            required: false
          }
        ],
        order: [Sequelize.literal('"appointmentDetails"."start_time"')]
      };
      const queryPastAppt: FindOptions = {
        attributes: ['id', 'status', 'customerId', 'contentReview', 'numberRating'],
        where: {
          customerId: customerId,
          bookingSource: AppointmentBookingSource.MARKETPLACE,
          status: {
            [Op.or]: [
              { [Op.eq]: EAppointmentStatus.CANCEL },
              { [Op.eq]: EAppointmentStatus.COMPLETED },
              { [Op.eq]: EAppointmentStatus.NO_SHOW }
            ]
          }
        },
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            attributes: ['id', 'startTime'],
            include: [
              {
                model: ServiceModel,
                as: 'service',
                attributes: ['id', 'cateServiceId', 'description', 'duration', 'name', 'salePrice'],
                required: false
              },
              {
                model: StaffModel,
                as: 'staffs',
                attributes: ['id', 'firstName', 'avatarPath'],
                required: false,
                through: { attributes: [] }
              }
            ]
          },
          {
            model: LocationModel,
            as: 'location',
            attributes: ['id', 'name', 'address'],
            required: false
          }
        ],
        order: [Sequelize.literal('"appointmentDetails"."start_time" DESC')]
      };
      let myAppointments: any = {};
      const upcomingApointments = await AppointmentModel.findAll(queryUpcomingAppt);
      const pastApointments = await AppointmentModel.findAll(queryPastAppt);
      myAppointments = {
        upcomingApointments,
        pastApointments
      };
      return res.status(httpStatus.OK).send(buildSuccessMessage(myAppointments));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   appointmentCancel:
   *       required:
   *           - appointmentId
   *           - cancelReason
   *       properties:
   *           appointmentId:
   *               type: string
   *           cancelReason:
   *               type: string
   */
  /**
   * @swagger
   * /booking/appointment/customer-cancel-appointment:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: cancelAppointment
   *     parameters:
   *       - in: "body"
   *         name: "body"
   *         required: true
   *         schema:
   *             $ref: '#/definitions/appointmentCancel'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        appointmentId: req.body.appointmentId,
        cancelReason: req.body.cancelReason
      };
      const validateErrors = validate(data, appointmentCancelSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const appointment = await AppointmentModel.findOne({
        where: { id: data.appointmentId, customerId: res.locals.customerPayload.id }
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`appointment ${data.appointmentId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (
        appointment.status !== EAppointmentStatus.NEW &&
        appointment.status !== EAppointmentStatus.CONFIRMED &&
        appointment.status !== EAppointmentStatus.ARRIVED
      ) {
        return next(new CustomError(bookingErrorDetails.E_2003(`Can not cancel appointment`), HttpStatus.BAD_REQUEST));
      }
      transaction = await sequelize.transaction();
      await appointment.update({ status: EAppointmentStatus.CANCEL, cancelReason: data.cancelReason }, { transaction });
      await AppointmentDetailModel.update(
        { status: EAppointmentStatus.CANCEL },
        { where: { appointmentId: data.appointmentId }, transaction }
      );
      await transaction.commit();
      return res.status(httpStatus.OK).send();
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
   * /booking/appointment/customer-get-appointment/{appointmentId}:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAppointmentCustomer
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
  public getAppointmentCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.appointmentId, appointmentIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const appointment = await AppointmentModel.findOne({
        where: { id: req.params.appointmentId, customerId: res.locals.customerPayload.id },
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

  /**
   * @swagger
   * definitions:
   *   appointmentReschedule:
   *       required:
   *           - appointmentId
   *           - startTime
   *       properties:
   *           appointmentId:
   *               type: string
   *           startTime:
   *               type: string
   */
  /**
   * @swagger
   * /booking/appointment/customer-reschedule-appointment:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: rescheduleAppointment
   *     parameters:
   *       - in: "body"
   *         name: "body"
   *         required: true
   *         schema:
   *             $ref: '#/definitions/appointmentReschedule'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, appointmentRescheduleSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const appointment = await AppointmentModel.findOne({
        where: { id: req.body.appointmentId, customerId: res.locals.customerPayload.id }
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`appointment ${req.body.appointmentId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (
        appointment.status !== EAppointmentStatus.NEW &&
        appointment.status !== EAppointmentStatus.CONFIRMED &&
        appointment.status !== EAppointmentStatus.ARRIVED
      ) {
        return next(
          new CustomError(bookingErrorDetails.E_2003(`Can not reschedule appointment`), HttpStatus.BAD_REQUEST)
        );
      }
      await AppointmentDetailModel.update(
        { startTime: req.body.startTime },
        { where: { appointmentId: req.body.appointmentId } }
      );
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   appointmentReady:
   *       required:
   *           - appointmentId
   *       properties:
   *           appointmentId:
   *               type: string
   */
  /**
   * @swagger
   * /booking/appointment/customer-set-ready-appointment:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: setReadyAppointment
   *     parameters:
   *       - in: "body"
   *         name: "body"
   *         required: true
   *         schema:
   *             $ref: '#/definitions/appointmentReady'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public setReadyAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const appointmentId = req.body.appointmentId;
      const validateErrors = validate(appointmentId, appointmentIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const appointment = await AppointmentModel.findOne({
        where: { id: appointmentId, customerId: res.locals.customerPayload.id }
      });
      if (!appointment) {
        return next(
          new CustomError(bookingErrorDetails.E_2002(`appointment ${appointmentId} not found`), HttpStatus.NOT_FOUND)
        );
      }
      if (appointment.status !== EAppointmentStatus.NEW && appointment.status !== EAppointmentStatus.CONFIRMED) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2003(`Can not update status ready for appointment`),
            HttpStatus.BAD_REQUEST
          )
        );
      }
      transaction = await sequelize.transaction();
      await appointment.update({ status: EAppointmentStatus.ARRIVED }, { transaction });
      await AppointmentDetailModel.update(
        { status: EAppointmentStatus.ARRIVED },
        { where: { appointmentId: appointmentId }, transaction }
      );
      await transaction.commit();
      return res.status(httpStatus.OK).send();
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
   *   appointmentRating:
   *       required:
   *           - appointmentId
   *           - numberRating
   *           - contentReview
   *       properties:
   *           appointmentId:
   *               type: string
   *           numberRating:
   *                type: integer
   *           contentReview:
   *                 type: string
   */
  /**
   * @swagger
   * /booking/appointment/customer-rating-appointment:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: ratingAppointment
   *     parameters:
   *       - in: "body"
   *         name: "body"
   *         required: true
   *         schema:
   *             $ref: '#/definitions/appointmentRating'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public ratingAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, ratingAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      let appointment = await AppointmentModel.findOne({
        where: { id: req.body.appointmentId, customerId: res.locals.customerPayload.id }
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`appointment ${req.body.appointmentId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (appointment.status !== EAppointmentStatus.COMPLETED) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2011(`Status appointment ${req.body.appointmentId} must be complete`),
            HttpStatus.BAD_REQUEST
          )
        );
      }
      const data = {
        numberRating: req.body.numberRating,
        contentReview: req.body.contentReview
      };
      appointment = await appointment.update(data, { where: { id: req.body.appointmentId } });
      return res.status(httpStatus.OK).send(appointment);
    } catch (error) {
      return next(error);
    }
  };
}
