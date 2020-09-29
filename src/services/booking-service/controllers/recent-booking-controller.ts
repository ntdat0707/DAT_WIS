import { Request, Response, NextFunction } from 'express';
require('dotenv').config();
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { LocationModel, RecentBookingModel, sequelize, StaffModel } from '../../../repositories/postgres/models';

import { BaseController } from './base-controller';
import { checkCustomerIdSchema, createRecentBookingSchema } from '../configs/validate-schemas';

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
      const recentBooking = await RecentBookingModel.create(
        {
          customerId: dataInput.customerId,
          appointmentId: dataInput.appointmentId,
          locationId: dataInput.locationId,
          serviceId: dataInput.serviceId,
          staffId: dataInput.staffId
        },
        { transaction }
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentBooking));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/recent-booking/market-place/get-recent-booking/{customerId}:
   *   get:
   *     tags:
   *       - Booking
   *     name: getRecentBooking
   *     parameters:
   *     - in: path
   *       name: customerId
   *       schema:
   *          type: string
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getRecentBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.params.customerId;
      const validateErrors = validate(dataInput, checkCustomerIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const recentBookings = (
        await RecentBookingModel.findAll({
          where: { customerId: dataInput },
          order: [['createdAt', 'DESC']],
          limit: 4
        })
      ).map((recentBooking: any) => ({
        locationId: recentBooking.locationId,
        staffId: recentBooking.staffId
      }));

      let recentBookingHistory: any = [];
      for (let i = 0; i < recentBookings.length; i++) {
        let staff: any = await StaffModel.findOne({
          where: { id: recentBookings[i].staffId },
          attributes: ['id', 'firstName', 'avatarPath'],
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              through: { attributes: [] },
              where: { id: recentBookings[i].locationId },
              attributes: ['name']
            }
          ]
        });
        staff = staff.dataValues;
        staff = {
          ...staff,
          ...staff.workingLocations[0].dataValues,
          ['workingLocations']: undefined
        };

        recentBookingHistory.push(staff);
      }
      //filter Duplication Element

      // recentBookingHistory.filter((item: any, index: any) => {
      //   return recentBookingHistory.indexOf(item === index);
      // });
      
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentBookingHistory));
    } catch (err) {}
  };
}
