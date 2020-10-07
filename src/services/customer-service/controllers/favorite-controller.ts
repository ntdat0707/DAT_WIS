import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createFavoriteSchema, getListFavoriteSchema } from '../configs/validate-schemas/favorite';
import { FavoriteModel } from '../../../repositories/postgres/models/favorite-model';
import { LocationModel } from '../../../repositories/postgres/models/location';
// import { CustomerModel } from '../../../repositories/postgres/models/customer-model';
import { Op } from 'sequelize';
import { MarketPlaceValueModel } from '../../../repositories/postgres/models/marketplace-value-model';
import { MarketPlaceFieldsModel } from '../../../repositories/postgres/models';
import { parseDatabyType } from '../../../services/branch-service/utils/marketplace-field';

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
      const data = {
        locationId: req.body.locationId,
        customerId: res.locals.customerPayload.id
      };
      const validateErrors = validate(data, createFavoriteSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      let favorite = await FavoriteModel.findOne({
        where: { locationId: data.locationId, customerId: data.customerId }
      });
      if (!favorite) {
        favorite = await FavoriteModel.create(data);
      } else {
        if (favorite.isFavorite === false) {
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
   * /customer/favorite/{customerId}/share-list-favorite:
   *   get:
   *     tags:
   *       - Customer
   *     name: shareListFavorite
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
  public shareListFavorite = async (req: Request, res: Response, next: NextFunction) => {
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

      let locations: any = await LocationModel.findAll({
        where: {
          id: { [Op.in]: locationIds }
        },
        include: [
          {
            model: MarketPlaceValueModel,
            as: 'marketplaceValues',
            required: true,
            attributes: ['value'],
            include: [
              {
                model: MarketPlaceFieldsModel,
                as: 'marketplaceField',
                required: true,
                attributes: ['name', 'type']
              }
            ]
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });

      locations = locations.map((location: any) => {
        const locationDetail = location.marketplaceValues?.reduce(
          (acc: any, { value, marketplaceField: { name, type } }: any) => ({
            ...acc,
            [name]: parseDatabyType[type](value)
          }),
          {}
        );
        location = {
          ...location.dataValues,
          ...locationDetail,
          marketplaceValues: undefined
        };
        return location;
      });

      return res.status(httpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/favorite/list-favorite:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: listFavorite
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
      const customerId = res.locals.customerPayload.id;
      const validateErrors = validate(customerId, getListFavoriteSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const locationIds: any = (
        await FavoriteModel.findAll({
          where: { customerId: customerId, isFavorite: true }
        })
      ).map((locationId: any) => locationId.locationId);

      let locations: any = await LocationModel.findAll({
        where: {
          id: { [Op.in]: locationIds }
        },
        include: [
          {
            model: MarketPlaceValueModel,
            as: 'marketplaceValues',
            required: true,
            attributes: ['value'],
            include: [
              {
                model: MarketPlaceFieldsModel,
                as: 'marketplaceField',
                required: true,
                attributes: ['name', 'type']
              }
            ]
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });

      locations = locations.map((location: any) => {
        const locationDetail = location.marketplaceValues?.reduce(
          (acc: any, { value, marketplaceField: { name, type } }: any) => ({
            ...acc,
            [name]: parseDatabyType[type](value)
          }),
          {}
        );
        location = {
          ...location.dataValues,
          ...locationDetail,
          marketplaceValues: undefined
        };
        return location;
      });

      return res.status(httpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };
}
