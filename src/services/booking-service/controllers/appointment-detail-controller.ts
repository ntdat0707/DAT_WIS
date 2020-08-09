import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { AppointmentModel, AppointmentDetailModel } from '../../../repositories/postgres/models';

import { createAppointmentDetailFullSchema } from '../configs/validate-schemas';
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
      const appointmentDetail = await AppointmentDetailModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetail));
    } catch (error) {
      return next(error);
    }
  };
}
