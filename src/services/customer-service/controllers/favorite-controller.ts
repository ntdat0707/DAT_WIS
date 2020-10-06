import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createFavoriteSchema, getListFavoriteSchema } from '../configs/validate-schemas/favorite';
import { FavoriteModel } from '../../../repositories/postgres/models/favorite-model';
import { LocationModel } from '../../../repositories/postgres/models/location';
import { CustomerModel } from '../../../repositories/postgres/models/customer-model';
import { Op } from 'sequelize';
import { MarketPlaceValueModel } from '../../../repositories/postgres/models/marketplace-value-model';
import { MarketPlaceFieldsModel } from '../../../repositories/postgres/models';
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
      console.log('customerID:::', res.locals.customerPayload);
      const data = {
        locationId: req.body.locationId,
        customerId: res.locals.customerPayload.id
      };
      const validateErrors = validate(data, createFavoriteSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      console.log('checked create favorite');
      let favorite = await FavoriteModel.findOne({
        where: { locationId: data.locationId, customerId: data.customerId }
      });
      console.log('Favorite::', favorite);
      if (!favorite) {
        favorite = await FavoriteModel.create(data);
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

  /**
   * @swagger
   * /customer/favorite/{customerId}/list-favorite:
   *   get:
   *     tags:
   *       - Customer
   *     name: listFavorite
   *     parameters:
   *     - in: path
   *       name: customerId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public listFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.customerId, getListFavoriteSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const locationIds: any = (
        await FavoriteModel.findAll({
          where: { customerId: req.params.customerId, isFavorite: true }
        })
      ).map((locationId: any) => locationId.locationId);

      const locations = await LocationModel.findAll({
        where: {
          id: { [Op.in]: locationIds }
        },
        include: [
          {
            model: MarketPlaceValueModel,
            as: 'marketplaceValues',
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: MarketPlaceFieldsModel,
                as: 'marketplaceField',
                required: true,
                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
              }
            ]
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });

      return res.status(httpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };
}
