
import { Request, Response, NextFunction } from 'express';
require('dotenv').config();
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  RecentBookingModel, sequelize
} from '../../../repositories/postgres/models';

import { BaseController } from './base-controller';
import { createRecentBookingSchema } from '../configs/validate-schemas';
export class RecentBookingController extends BaseController {

  /**
    * @swagger
    * definitions:
    *   CreateRecentBooking:
    *       required:
    *           - customerId
    *           - appointmentId
    *           - locationId
    *           - staffId
    *           - serviceId
    *       properties:
    *           customerId:
    *               type: string
    *           appointmentId:
    *               type: string
    *           locationId:
    *               type: string
    *           staffId:
    *               type: string
    *           serviceId:
    *               type: string
    *
    */

  /**
    * @swagger
    * /booking/recent-booking/market-place/create-recent-booking:
    *   post:
    *     tags:
    *       - Booking
    *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateRecentBooking'
    *     name: createRecentBooking
    *     responses:
    *       200:
    *         description: success
    *       500:
    *         description: Server internal errors
    */

  public createRecentBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let transaction = null;
      const dataInput = {
        customerId: req.body.customerId,
        appointmentId: req.body.appointmentId,
        locationId: req.body.locationId,
        serviceId: req.body.serviceId,
        staffId: req.body.staffId
      };
      const validateErrors = await validate(dataInput, createRecentBookingSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      transaction = await sequelize.transaction();
      const recentBooking = await RecentBookingModel.create({
        customerId: dataInput.customerId,
        appointmentId: dataInput.appointmentId,
        locationId: dataInput.locationId,
        serviceId: dataInput.serviceId,
        staffId: dataInput.staffId
      }, { transaction }
      );

      // let recentBookingStaffs: any =
      //   (await StaffModel.findAll({
      //     include: [
      //       {
      //         model: AppointmentDetailModel,
      //         as: 'appointmentDetails',
      //         through: { attributes: [] },
      //         attributes: { exclude: ['appointmentId', 'createdAt', 'updatedAt', 'deletedAt'] },
      //         required: true,
      //         include: [
      //           {
      //             model: AppointmentModel,
      //             as: 'appointment',
      //             where: {
      //               customerId: dataInput
      //             },
      //             required: true,
      //             attributes: ['customerId'],
      //             include: [
      //               {
      //                 model: LocationModel,
      //                 as: 'location',
      //                 required: true,
      //                 attributes: ['name']
      //               }
      //             ]
      //           }
      //         ]
      //       }
      //     ],
      //     attributes: ['id', 'firstName'],
      //     order: [['createdAt', 'DESC']],
      //   })
      //   ).map((staff: any) => ({
      //     id: staff.id,
      //     name: staff.firstName,
      //     locations: staff.appointmentDetails.map((location: any) => ({
      //       locationName: location.appointment.location.name
      //     }))
      //   }));
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentBooking));
    } catch (error) {
      return next(error);
    }
  };
}