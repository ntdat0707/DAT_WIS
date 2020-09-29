import { Request, Response, NextFunction } from 'express';
require('dotenv').config();
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { RecentBookingModel, sequelize } from '../../../repositories/postgres/models';

import { createRecentViewSchema } from '../configs/validate-schemas/recent-view';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { RecentViewModel } from '../../../repositories/postgres/models/recent-view-model';

export class RecentViewController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   CreateRecentView:
   *       required:
   *           - customerId
   *           - locationId
   *       properties:
   *           customerId:
   *               type: string
   *           locationId:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/recent-view/market-place/create-recent-view:
   *   post:
   *     tags:
   *       - Branch
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateRecentView'
   *     name: createRecentView
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public createRecentView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let transaction = null;
      const dataInput = {
        customerId: req.body.customerId,
        locationId: req.body.locationId
      };
      const validateErrors = await validate(dataInput, createRecentViewSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      transaction = await sequelize.transaction();
      const recentView = await RecentViewModel.create(
        {
          customerId: dataInput.customerId,
          locationId: dataInput.locationId
        },
        { transaction }
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentView));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/recent-view/market-place/update-recent-view:
   *   put:
   *     tags:
   *       - Branch
   *     parameters:
   *     - in: query
   *       name: customerId
   *       required: true
   *     - in: query
   *       name: locationId
   *       required: true
   *     name: createRecentView
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public updateRecentView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let transaction = null;
      const dataInput = {
        customerId: req.body.customerId,
        locationId: req.body.locationId
      };
      const validateErrors = await validate(dataInput, createRecentViewSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      transaction = await sequelize.transaction();
      let locationRecentView: any = await RecentViewModel.findOne({
        where: {
          customerId: dataInput.customerId,
          locationId: dataInput.locationId
        }
      });
      locationRecentView = locationRecentView.dataValues;
      locationRecentView += 1;
      console.log('RecentView Update::', locationRecentView);
      let recentView = await RecentViewModel.update(
        {
          view: locationRecentView.view
        },
        { where: { id: locationRecentView.id }, transaction }
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentView));
    } catch (error) {
      return next(error);
    }
  };
}
