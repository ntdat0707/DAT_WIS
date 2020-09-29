import { Request, Response, NextFunction } from 'express';
require('dotenv').config();
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  LocationDetailModel,
  LocationImageModel,
  LocationModel,
  RecentBookingModel,
  sequelize
} from '../../../repositories/postgres/models';

import { createRecentViewSchema } from '../configs/validate-schemas/recent-view';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { RecentViewModel } from '../../../repositories/postgres/models/recent-view-model';
import { checkCustomerIdSchema } from '../../../services/booking-service/configs/validate-schemas/recent-booking';
import { Op } from 'sequelize';

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
        customerId: req.query.customerId,
        locationId: req.query.locationId
      };
      const validateErrors = await validate(dataInput, createRecentViewSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      transaction = await sequelize.transaction();
      let locationRecentView: any = await RecentViewModel.findOne({
        raw: true,
        where: {
          customerId: dataInput.customerId,
          locationId: dataInput.locationId
        }
      });
      locationRecentView.view += 1;

      let recentView = await RecentViewModel.update(
        {
          view: locationRecentView.view
        },
        { where: { id: locationRecentView.id }, transaction }
      );
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(recentView));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/recent-view/market-place/get-recent-view/{customerId}:
   *   get:
   *     tags:
   *       - Branch
   *     parameters:
   *     - in: path
   *       name: customerId
   *     name: createRecentView
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public getRecentView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.params.customerId;
      const validateErrors = await validate(dataInput, checkCustomerIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));

      let recentViews = (
        await RecentViewModel.findAll({
          where: {
            customerId: dataInput
          },
          order: [['createdAt', 'DESC']]
        })
      ).map((recentView: any) => ({
        locationId: recentView.locationId
      }));
      if (!recentViews) {
        recentViews = [];
        return res.status(HttpStatus.OK).send(buildSuccessMessage(recentViews));
      }

      let locationIds: any = [];
      for (let i = 0; i < recentViews.length; i++) {
        locationIds.push(recentViews[i].locationId);
      }
      const locationViews: any = (
        await LocationModel.findAll({
          where: { id: { [Op.in]: locationIds } },
          include: [
            {
              model: LocationDetailModel,
              as: 'locationDetail',
              required: true,
              attributes: ['pathName']
            },
            {
              model: LocationImageModel,
              as: 'locationImages',
              required: true,
              attributes: ['path'],
              limit: 1
            }
          ],
          attributes: ['id', 'name', 'photo', 'address', 'district', 'ward']
        })
      ).map((locationView: any) => ({
        ...locationView.dataValues,
        ...locationView.locationDetail.dataValues,
        ...locationView.locationImages[0].dataValues,
        ['locationDetail']: undefined,
        ['locationImages']: undefined
      }));
      return res.status(HttpStatus.OK).send(buildSuccessMessage(locationViews));
    } catch (error) {
      return next(error);
    }
  };
}
