import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { PipelineStageModel, DealModel, CustomerWisereModel, StaffModel } from '../../../repositories/postgres/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createDealSchema } from '../configs/validate-schemas/deal';
import {
  pipelineStageErrorDetails,
  staffErrorDetails,
  customerErrorDetails
} from '../../../utils/response-messages/error-details';
import { createFavorite } from '../configs/validate-schemas/favorite';
import { FavoriteModel } from '../../../repositories/postgres/models/favorite-model';
import { where } from 'sequelize/types';
export class FavoriteController {
  /**
   * @swagger
   * definitions:
   *   CreateFavorite:
   *       properties:
   *           locationId:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/favorite/create-favorite:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createFavorite
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateFavorite'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */

  public createFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('customerID:::',res.locals.customerPayload);
      const data = {
        locationId: req.body.locationId,
        customerId: res.locals.customerPayload.id
      };
      const validateErrors = validate(data, createFavorite);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const favorite = await FavoriteModel.findOne({
        where: { locationId: data.locationId, customerId: data.customerId }
      });
      if (!favorite) {
        await FavoriteModel.create(data);
      } else {
        if (favorite.isFavorite == false) {
          await FavoriteModel.update(
            { isFavorite: true },
            { where: { locationId: data.locationId, customerId: data.customerId } }
          );
        } else {
          await FavoriteModel.update(
            { isFavorite: false },
            { where: { locationId: data.locationId, customerId: data.customerId } }
          );
        }
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(favorite));
    } catch (error) {
      return next(error);
    }
  };
}
