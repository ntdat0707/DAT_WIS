import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { LocationModel, sequelize } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { initCompanySchema, updateCompanyDetailSchema } from '../configs/validate-schemas/company';
import { CompanyModel } from '../../../repositories/postgres/models';
import { companyErrorDetails } from '../../../utils/response-messages/error-details/branch/company';
import { v4 as uuidv4 } from 'uuid';
import { CompanyDetailModel } from '../../../repositories/postgres/models/company-detail-model';
import { createMarketplaceField } from '../configs/validate-schemas/marketplace';
import { locationErrorDetails } from 'src/utils/response-messages/error-details/branch/location';
import { MarketPlaceFieldsModel } from 'src/repositories/postgres/models/marketplace-fields-model';
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
   *           name:
   *               type: string
   *           options:
   *               type: string
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
    let transaction = null;
    try {
      const data: any = {
        ...body
      };
      const validateErrors = validate(data, createMarketplaceField);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      let marketplaceField = await MarketPlaceFieldsModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(marketplaceField));
    } catch (error) {
      return next(error);
    }
  };
}
