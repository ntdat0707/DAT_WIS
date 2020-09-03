import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { branchErrorDetails, bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  AppointmentDetailModel,
  AppointmentModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  StaffModel,
  ServiceModel,
  ResourceModel,
  LocationModel,
  CustomerModel
} from '../../../repositories/postgres/models';

import { createAppointmentGroupSchema, appointmentGroupIdSchema } from '../configs/validate-schemas';
import { BaseController } from './base-controller';
import { FindOptions } from 'sequelize';
export class AppointmentGroupController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   CreateAppointmentInGroup:
   *       required:
   *           - appointmentDetails
   *           - isPrimary
   *       properties:
   *           customerId:
   *               type: string
   *           isPrimary:
   *               type: boolean
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateNewAppointmentGroup:
   *       required:
   *           - locationId
   *           - date
   *           - appointments
   *       properties:
   *           locationId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentInGroup'
   *
   */

  /**
   * @swagger
   * /booking/appointment-group/create:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: createAppointmentGroup
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateNewAppointmentGroup'
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
  public createAppointmentGroup = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        locationId: req.body.locationId,
        date: req.body.date,
        appointments: req.body.appointments
      };
      const validateErrors = validate(data, createAppointmentGroupSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(data.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${data.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const verifyAppointmentDetailTask = [];
      let countPrimary = 0;
      for (const apt of data.appointments) {
        if (apt.isPrimary === true) countPrimary++;
        verifyAppointmentDetailTask.push(this.verifyAppointmentDetails(apt.appointmentDetails, data.locationId));
      }
      if (countPrimary !== 1) {
        return next(new CustomError(bookingErrorDetails.E_2006(), HttpStatus.BAD_REQUEST));
      }
      // veriry appointment details
      if (verifyAppointmentDetailTask.length > 0) {
        const verifyAppointmentDetailResults = await Promise.all(verifyAppointmentDetailTask);
        for (const verifyResult of verifyAppointmentDetailResults) {
          if (verifyResult instanceof CustomError) return next(verifyResult);
        }
      }

      const newAppointmentGroupId = uuidv4();
      //create appoinment
      const createAppointmentTasks = [];
      const createAppointmentDetailTasks = [];
      const createAppointmentDetailStaffTasks = [];
      for (const apptData of data.appointments) {
        const newAppointmentId = uuidv4();
        createAppointmentTasks.push({
          id: newAppointmentId,
          appointmentGroupId: newAppointmentGroupId,
          locationId: data.locationId,
          date: data.date,
          customerId: apptData.customerId ? apptData.customerId : null,
          isPrimary: apptData.isPrimary === true ? true : false
        });

        //appointment detail data
        for (const apptDetailData of apptData.appointmentDetails) {
          const newAppointmentDetailId = uuidv4();
          createAppointmentDetailTasks.push({
            id: newAppointmentDetailId,
            appointmentId: newAppointmentId,
            serviceId: apptDetailData.serviceId,
            startTime: apptDetailData.startTime,
            resourceId: apptDetailData.resourceId ? apptDetailData.resourceId : null
          });

          // data appointment detail staff
          for (const staffIdData of apptDetailData.staffIds) {
            createAppointmentDetailStaffTasks.push({
              appointmentDetailId: newAppointmentDetailId,
              staffId: staffIdData
            });
          }
        }
      }
      await AppointmentGroupModel.create(
        { id: newAppointmentGroupId, locationId: data.locationId, date: data.date },
        { transaction }
      );
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentModel.bulkCreate(createAppointmentTasks, { transaction });
      await AppointmentDetailModel.bulkCreate(createAppointmentDetailTasks, { transaction });
      await AppointmentDetailStaffModel.bulkCreate(createAppointmentDetailStaffTasks, { transaction });
      await transaction.commit();
      const appointmentGroupStoraged = await AppointmentGroupModel.findOne({
        where: { id: newAppointmentGroupId },
        include: [
          { model: LocationModel, as: 'location', required: true },
          {
            model: AppointmentModel,
            as: 'appointments',
            required: true,
            include: [
              {
                model: AppointmentDetailModel,
                as: 'appointmentDetails',
                required: true,
                include: [
                  {
                    model: StaffModel.scope('safe'),
                    as: 'staffs',
                    required: true
                  },
                  {
                    model: ServiceModel,
                    as: 'service',
                    required: true
                  },
                  {
                    model: ResourceModel,
                    as: 'resource'
                  }
                ]
              }
            ]
          }
        ]
      });
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { appointmentGroupId: newAppointmentGroupId },
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
        ]
      };
      const listappointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listappointmentDetail);
      res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentGroupStoraged));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment-group/get-appointment-group/{appointmentGroupId}:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAppointmentGroup
   *     parameters:
   *     - in: path
   *       name: appointmentGroupId
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
  public getAppointmentGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.appointmentGroupId, appointmentGroupIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentGroup = await AppointmentGroupModel.findOne({
        where: { id: req.params.appointmentGroupId, locationId: workingLocationIds },
        include: [
          {
            model: AppointmentModel,
            as: 'appointments',
            required: true,
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
          }
        ]
      });
      if (!appointmentGroup) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment-group ${req.params.appointmentGroupId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentGroup));
    } catch (error) {
      return next(error);
    }
  };
}
