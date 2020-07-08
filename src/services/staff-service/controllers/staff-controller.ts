//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../ultils/validator';
import { CustomError } from '../../../ultils/error-handlers';
import { staffErrorDetails } from '../../../ultils/response-messages/error-details';
import { buildSuccessMessage } from '../../../ultils/response-messages';
import { StaffModel } from '../../../repositories/postresql/models';

import { NODE_NAME } from '../configs/consts';
import { staffIdSchema } from '../configs/validate-schemas';

export class StaffController {
  constructor() {}
  /**
   * @swagger
   * /staff/get-staff/{staffId}:
   *   post:
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

  public async getStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staffId = req.params.staffId;
      const validateErrors = validate(staffId, staffIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, NODE_NAME, HttpStatus.BAD_REQUEST));
      const staff = await StaffModel.findOne({ where: { id: staffId } });
      if (!staff)
        return next(
          new CustomError(staffErrorDetails.E_4OO(`staffId ${staffId} not found`), NODE_NAME, HttpStatus.NOT_FOUND)
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staff));
    } catch (error) {
      return next(error);
    }
  }
}
