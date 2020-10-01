import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
// import { LocationModel, sequelize } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
// import { initCompanySchema, updateCompanyDetailSchema } from '../configs/validate-schemas/company';
// import { CompanyModel } from '../../../repositories/postgres/models';
// import { companyErrorDetails } from '../../../utils/response-messages/error-details/branch/company';
// import { v4 as uuidv4 } from 'uuid';
// import { CompanyDetailModel } from '../../../repositories/postgres/models/company-detail-model';
import { createMarketplaceField, createMarketplaceValue } from '../configs/validate-schemas/marketplace';
// import { locationErrorDetails } from 'src/utils/response-messages/error-details/branch/location';
import { MarketPlaceFieldsModel, LocationModel, MarketPlaceValueModel } from '../../../repositories/postgres/models';
import { ETypeMarketPlaceField } from '../../../utils/consts';
import Joi from 'joi';
import {locationErrorDetails} from '../../../utils/response-messages/error-details/branch/location';

export class MarketPlaceFieldsController {
  /**
   * @swagger
   * definitions:
   *   CreateMarketPlaceField:
   *       required:
   *           - type
   *           - name
   *       properties:
   *           type:
   *               type: string
   *               enum: [ NUMBER, STRING, BOOLEAN  ]
   *           name:
   *               type: string
   *           options:
   *               type: array
   *               items:
   *                 type: string
   *
   */

  /**
   * @swagger
   * /branch/marketplace/create-marketplace-field:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createMarketPlaceField
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateMarketPlaceField'
   *     responses:
   *       200:
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public createMarketPlaceField = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
         type: body.type,
         name: body.name,
         options: body.options
      };
      const validateErrors = validate(data, createMarketplaceField);

      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      data.options = JSON.stringify(data.options);
      const marketplaceField = await MarketPlaceFieldsModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(marketplaceField));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateMarketPlaceValue:
   *       required:
   *           - type
   *           - name
   *       properties:
   *           locationId:
   *               type: string
   *           fieldId:
   *               type: string
   *           value:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/marketplace/create-marketplace-value:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createMarketPlaceValue
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateMarketPlaceValue'
   *     responses:
   *       200:
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public createMarketPlaceValue = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
         locationId: body.locationId,
         fieldId: body.fieldId,
         value: body.value
      };
      const validateErrors = validate(data, createMarketplaceValue);

      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      const location  = await LocationModel.findOne({where: {id: data.locationId}});

      if (!location) {
        return next(
          new CustomError(
            locationErrorDetails.E_1000(`locationId ${data.locationId} not found`),
            HttpStatus.NOT_FOUND
          )
        );
      }

      const marketPlaceField = await MarketPlaceFieldsModel.findOne({where: {id: data.fieldId}});
      const parseField: any = {
         [ETypeMarketPlaceField.NUMBER](value: string) {
            return +value;
         },
         [ETypeMarketPlaceField.STRING](value: string) {
            return value;
         },
         [ETypeMarketPlaceField.BOOLEAN](value: string) {
            if (value.toLowerCase() === 'true') { return true; }
            if (value.toLowerCase() === 'false') { return false; }
            return null;
         }
      };

      const validateValue: any = {
         [ETypeMarketPlaceField.NUMBER]: Joi.number().required().label('value'),
         [ETypeMarketPlaceField.STRING]: marketPlaceField.options
            ? Joi.string()
               .valid(...(JSON.parse(marketPlaceField.options) as any[]))
               .required()
               .label('value')
            : Joi.string()
               .required()
               .label('value'),
         [ETypeMarketPlaceField.BOOLEAN]: Joi.boolean().required().label('value')
      };
      const valueValidateErrors = validate(
         parseField[marketPlaceField.type](data.value),
         validateValue[marketPlaceField.type]
      );
      if (valueValidateErrors) {
        return next(new CustomError(valueValidateErrors, HttpStatus.BAD_REQUEST));
      }

      const marketplaceValue = await MarketPlaceValueModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(marketplaceValue));
    } catch (error) {
      return next(error);
    }
  };
}
