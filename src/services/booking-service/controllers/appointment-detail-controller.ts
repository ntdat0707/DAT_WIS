import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  AppointmentModel,
  AppointmentDetailModel,
  AppointmentDetailStaffModel,
  ServiceModel,
  ResourceModel,
  StaffModel,
  LocationModel
} from '../../../repositories/postgres/models';

import {
  createAppointmentDetailFullSchema,
  updateAppointmentDetailSchema,
  appointmentDetailIdSchema
} from '../configs/validate-schemas';
import { BaseController } from './base-controller';

export class AppointmentDetailController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   CreateAppointmentDetailFull:
   *       required:
   *           - appointmentId
   *           - serviceId
   *           - resourceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           appointmentId:
   *               type: string
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
   * /booking/appointment-detail/create:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: createAppointmentDetail
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateAppointmentDetailFull'
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
  public createAppointmentDetail = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        appointmentId: req.body.appointmentId,
        staffIds: req.body.staffIds,
        serviceId: req.body.serviceId,
        resourceId: req.body.resourceId,
        startTime: req.body.startTime
      };
      const validateErrors = validate(data, createAppointmentDetailFullSchema);
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
      const checkAppointmentDetail = await this.verifyAppointmentDetails([data], appointment.locationId);
      if (checkAppointmentDetail instanceof CustomError) return next(checkAppointmentDetail);
      // start transaction
      transaction = await sequelize.transaction();
      const appointmentDetail = await AppointmentDetailModel.create(
        {
          serviceId: data.serviceId,
          resourceId: data.resourceId ? data.resourceId : null,
          startTime: data.startTime,
          appointmentId: data.appointmentId
        },
        { transaction }
      );
      if (data.staffIds) {
        const appointmentDetailStaffData = data.staffIds.map((id: string) => ({
          appointmentDetailId: appointmentDetail.id,
          staffId: id
        }));
        await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
      }
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetail));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentDetail:
   *       required:
   *           - appointmentDetailId
   *           - serviceId
   *           - resourceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           appointmentDetailId:
   *               type: string
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
   * /booking/appointment-detail/update:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: updateAppointmentDetail
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateAppointmentDetail'
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

  public updateAppointmentDetail = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        appointmentDetailId: req.body.appointmentDetailId,
        staffIds: req.body.staffIds,
        serviceId: req.body.serviceId,
        resourceId: req.body.resourceId,
        startTime: req.body.startTime
      };
      const validateErrors = validate(data, updateAppointmentDetailSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentDetailStoraged = await AppointmentDetailModel.findOne({
        where: { id: data.appointmentDetailId },
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { locationId: workingLocationIds }
          }
        ]
      });
      if (!appointmentDetailStoraged) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2004(`Not found appointment detail ${data.appointmentDetailId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      const appointmentId = appointmentDetailStoraged.appointmentId;
      const checkAppointmentDetail = await this.verifyAppointmentDetails(
        [data],
        (appointmentDetailStoraged as any).appointment.locationId
      );
      if (checkAppointmentDetail instanceof CustomError) return next(checkAppointmentDetail);
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentDetailStaffModel.destroy({
        where: { appointmentDetailId: data.appointmentDetailId },
        transaction
      });
      await AppointmentDetailModel.destroy({ where: { id: data.appointmentDetailId }, transaction });
      const appointmentDetail = await AppointmentDetailModel.create(
        {
          serviceId: data.serviceId,
          resourceId: data.resourceId ? data.resourceId : null,
          startTime: data.startTime,
          appointmentId
        },
        { transaction }
      );
      const appointmentDetailStaffData = data.staffIds.map((id: string) => ({
        appointmentDetailId: appointmentDetail.id,
        staffId: id
      }));
      await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetail));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment-detail/delete/{appointmentDetailId}:
   *   delete:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: deleteAppointmentDetail
   *     parameters:
   *     - in: path
   *       name: appointmentDetailId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */

  public deleteAppointmentDetail = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const appointmentDetailId = req.params.appointmentDetailId;
      const validateErrors = validate(appointmentDetailId, appointmentDetailIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentDetailStoraged = await AppointmentDetailModel.findOne({
        where: { id: appointmentDetailId },
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { locationId: workingLocationIds }
          }
        ]
      });
      if (!appointmentDetailStoraged) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2004(`Not found appointment detail ${appointmentDetailId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentDetailStaffModel.destroy({ where: { appointmentDetailId }, transaction });
      await AppointmentDetailModel.destroy({ where: { id: appointmentDetailId }, transaction });
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment-detail/get/{appointmentDetailId}:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAppointmentDetail
   *     parameters:
   *     - in: path
   *       name: appointmentDetailId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public getAppointmentDtail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointmentDetailId = req.params.appointmentDetailId;
      const validateErrors = validate(appointmentDetailId, appointmentDetailIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentDetail = await AppointmentDetailModel.findOne({
        where: { id: appointmentDetailId },
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { locationId: workingLocationIds },
            include: [
              {
                model: LocationModel,
                as: 'location'
              }
            ]
          },
          {
            model: StaffModel.scope('safe'),
            as: 'staffs',
            through: { attributes: [] }
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
      });
      if (!appointmentDetail) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2004(`Not found appointment detail ${appointmentDetailId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetail));
    } catch (error) {
      return next(error);
    }
  };
}