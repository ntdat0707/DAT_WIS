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
  customerCreateAppointmentSchema
} from '../configs/validate-schemas';
import { BaseController } from './base-controller';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
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
        bookingSource: AppointmentBookingSource.STAFF,
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
      //insert appointment here
      const appointmentData: any = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerWisereId: dataInput.customerWisereId ? dataInput.customerWisereId : null,
        bookingSource: dataInput.bookingSource
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
      query.include.push(conditionsStaffs);
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
          if (transaction) {
            await transaction.rollback();
          }
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
   *   UpdateAppointment:
   *       properties:
   *           customerWisereId:
   *               type: string
   *           locationId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           createNewAppointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateNewAppointmentDetail'
   *           updateAppointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/UpdateAppointmentDetail'
   *           deleteAppointments:
   *               type: array
   *               items:
   *                   type: string
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
        createNewAppointments: req.body.createNewAppointments,
        updateAppointments: req.body.updateAppointments,
        deleteAppointments: req.body.deleteAppointments,
        customerWisereId: req.body.customerWisereId,
        date: req.body.date
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

      //update appointment here
      const appointmentData: any = {
        date: data.date,
        customerWisereId: data.customerWisereId ? data.customerWisereId : appointment.customerWisereId
      };
      await AppointmentModel.update(appointmentData, { where: { id: data.appointmentId }, transaction });

      if (data.createNewAppointments && data.createNewAppointments.length > 0) {
        const appointmentDetails = await this.verifyAppointmentDetails(data.createNewAppointments, data.locationId);
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
      if (data.updateAppointments && data.updateAppointments.length > 0) {
        for (let i = 0; i < data.updateAppointments.length; i++) {
          const appointmentDetail = await AppointmentDetailModel.findOne({
            where: {
              id: data.updateAppointments[i].appointmentDetailId,
              appointmentId: data.appointmentId
            }
          });

          if (!appointmentDetail) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2004(
                  `Appointment detail ${data.updateAppointments[i].appointmentDetailId} not exist`
                ),
                HttpStatus.NOT_FOUND
              )
            );
          }
          await AppointmentDetailModel.destroy({
            where: { id: data.updateAppointments[i].appointmentDetailId },
            transaction
          });
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: data.updateAppointments[i].appointmentDetailId },
            transaction
          });
        }
        const appointmentDetailData: any[] = [];
        const appointmentDetailStaffData = [];
        const appointmentDetails = await this.verifyAppointmentDetails(data.updateAppointments, data.locationId);
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
      if (data.deleteAppointments && data.deleteAppointments.length > 0) {
        for (let i = 0; i < data.deleteAppointments.length; i++) {
          const appointmentDetail = await AppointmentDetailModel.findOne({
            where: {
              id: data.deleteAppointments[i],
              appointmentId: data.appointmentId
            }
          });

          if (!appointmentDetail) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2004(`Appointment detail ${data.deleteAppointments[i]} not exist`),
                HttpStatus.NOT_FOUND
              )
            );
          }
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: data.deleteAppointments[i] },
            transaction
          });
          await AppointmentDetailModel.destroy({
            where: { id: data.deleteAppointments[i] },
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
      //commit transaction
      await transaction.commit();
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
      //insert appointment here
      const appointmentData: any = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerId: id,
        bookingSource: dataInput.bookingSource
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
      appointment.date.getDate() +
      '/' +
      (appointment.date.getMonth() + 1) +
      '_' +
      appointment.customerWisere.lastName +
      '_' +
      appointment.customerWisere.phone;
    dataDeal.setDataValue('dealTitle', title);
    dataDeal.setDataValue('source', appointment.bookingSource);
    dataDeal.setDataValue('customerWisereId', appointment.customerWisere.id);
    let note;
    if (appointment.appointmentGroup) {
      note = appointment.id + '/' + appointment.appointmentGroup.id;
    } else {
      note = appointment.id;
    }
    dataDeal.setDataValue('note', note);
    dataDeal.setDataValue('expectedCloseDate', appointment.date);
    let amount = 0;
    listAppointmentDetail.forEach((appointmentDetail: any) => {
      amount += appointmentDetail.service.salePrice;
    });
    dataDeal.setDataValue('amount', amount);
    const pipeline: any = await PipelineModel.findOne({
      where: { companyId: companyId, name: 'Appointment' },
      include: [
        {
          model: PipelineStageModel,
          as: 'pipelineStages',
          where: { name: 'New' }
        }
      ]
    });
    dataDeal.setDataValue('pipelineStageId', pipeline.pipelineStages[0].id);
    dataDeal.setDataValue('createdBy', staffId);
    await DealModel.create(dataDeal.dataValues, transaction);
  }
}
