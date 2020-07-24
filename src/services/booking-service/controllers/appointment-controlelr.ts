import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
// import { FindOptions } from 'sequelize';
require('dotenv').config();

// import { validate } from '../../../utils/validator';
// import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
// import { LocationModel } from '../../../repositories/postgres/models';

// import { createLocationSchema } from '../configs/validate-schemas';

export class AppointmentController {
  constructor() {}

  /**
   * @swagger
   * /booking/appointment/test-api:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: test-booking-api
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public testApi = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res
        .status(HttpStatus.OK)
        .send(buildSuccessMessage({ yourLocations: res.locals.staffPayload.workingLocationIds }));
    } catch (error) {
      return next(error);
    }
  };
}
