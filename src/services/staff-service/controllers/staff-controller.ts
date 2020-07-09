//
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions } from 'sequelize';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
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

  /**
   * @swagger
   * /staff/get-staffs:
   *   post:
   *     tags:
   *       - Staff
   *     name: get-staffs
   *     parameters:
   *     - in: query
   *       name: pageNum
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageSize
   *       required: true
   *       schema:
   *          type: integer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public async getStaffs(req: Request, res: Response, next: NextFunction) {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, NODE_NAME, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {};
      const staffs = await paginate(
        StaffModel.scope('safe'),
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staffs));
    } catch (error) {
      return next(error);
    }
  }
}
