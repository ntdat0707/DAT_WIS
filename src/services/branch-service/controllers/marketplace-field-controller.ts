import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createMarketplaceField, createMarketplaceValue } from '../configs/validate-schemas/marketplace';
import { MarketPlaceFieldsModel, LocationModel, MarketPlaceValueModel } from '../../../repositories/postgres/models';
import { locationErrorDetails } from '../../../utils/response-messages/error-details/branch/location';
import { parseDatabyType, validateValuebyType } from '../utils';

export class MarketPlaceFieldController {
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

      const location = await LocationModel.findOne({ where: { id: data.locationId } });

      if (!location) {
        return next(
          new CustomError(locationErrorDetails.E_1000(`locationId ${data.locationId} not found`), HttpStatus.NOT_FOUND)
        );
      }

      const marketPlaceField = await MarketPlaceFieldsModel.findOne({ where: { id: data.fieldId } });

      const valueValidateErrors = validate(
        parseDatabyType[marketPlaceField.type](data.value),
        validateValuebyType(marketPlaceField)[marketPlaceField.type]
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

  /**
   * @swagger
   * /branch/marketplace/add-location-marketplace/{locationId}:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: addLocationMarketplace
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *       required: true
   *     - in: "formData"
   *       name: "description"
   *       type: string
   *     - in: "formData"
   *       name: "title"
   *       type: string
   *     - in: "formData"
   *       name: "payment"
   *       type: string
   *       enum:
   *          - Cash
   *          - Card
   *     - in: "formData"
   *       name: "parking"
   *       type: string
   *       enum:
   *          - Active
   *          - Inactive
   *     - in: "formData"
   *       name: "recoveryRooms"
   *       type: number
   *     - in: "formData"
   *       name: "totalBookings"
   *       type: number
   *     - in: "formData"
   *       name: "gender"
   *       type: number
   *     - in: "formData"
   *       name: "openedAt"
   *       type: string
   *       format: date-time
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

  // public addLocationMarketplace = async (req: Request, res: Response, next: NextFunction) => {
  //   let transaction = null;
  //   try {
  //     let data: any = {
  //       name: req.body.name,
  //       phone: req.body.phone,
  //       email: req.body.email,
  //       city: !req.body.city ? 'Ho Chi Minh' : req.body.city,
  //       district: req.body.district,
  //       ward: req.body.ward,
  //       description: req.body.description,
  //       title: req.body.title,
  //       address: req.body.address,
  //       latitude: req.body.latitude,
  //       longitude: req.body.longitude,
  //       workingTimes: req.body.workingTimes,
  //       parking: req.body.parking,
  //       totalBookings: req.body.totalBookings,
  //       payment: req.body.payment,
  //       recoveryRooms: req.body.recoveryRooms,
  //       rating: req.body.rating,
  //     };

  //     const validateErrors = validate(data, createLocationSchema);
  //     if (validateErrors) {
  //       return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
  //     }
  //     data.companyId = res.locals.staffPayload.companyId;
  //     if (req.file) data.photo = (req.file as any).location;
  //     const company = await CompanyModel.findOne({ where: { id: data.companyId } });

  //     const city = await CityModel.findOne({
  //       where: {
  //         name: Sequelize.literal(`unaccent("CityModel"."name") ilike unaccent('%${data.city}%')`)
  //       }
  //     });
  //     const cityDetail: any = { cityId: city.id, city: city.name };
  //     data = Object.assign(data, cityDetail);
  //     console.log('Data', data);
  //     // start transaction
  //     transaction = await sequelize.transaction();
  //     const location = await LocationModel.create(data, { transaction });
  //     if (req.body.workingTimes && req.body.workingTimes.length > 0) {
  //       if (_.uniqBy(req.body.workingTimes, 'day').length !== req.body.workingTimes.length) {
  //         return next(
  //           new CustomError(locationErrorDetails.E_1002('Weekday do not allow duplicate value'), HttpStatus.BAD_REQUEST)
  //         );
  //       }
  //       const even = (element: any) => {
  //         return !moment(element.range[0], 'hh:mm').isBefore(moment(element.range[1], 'hh:mm'));
  //       };
  //       const checkValidWoringTime = await req.body.workingTimes.some(even);
  //       if (checkValidWoringTime) {
  //         return next(
  //           new CustomError(locationErrorDetails.E_1004(`startTime not before endTime`), HttpStatus.BAD_REQUEST)
  //         );
  //       }
  //       const workingsTimes = (req.body.workingTimes as []).map((value: any) => ({
  //         locationId: location.id,
  //         weekday: value.day,
  //         startTime: value.range[0],
  //         endTime: value.range[1],
  //         isEnabled: value.enabled
  //       }));
  //       await LocationWorkingHourModel.bulkCreate(workingsTimes, { transaction });
  //     }
  //     await LocationStaffModel.create({ staffId: company.ownerId, locationId: location.id }, { transaction });
  //     await StaffModel.update({ onboardStep: 1 }, { where: { id: company.ownerId }, transaction });

  //     //commit transaction
  //     await transaction.commit();
  //     return res.status(HttpStatus.OK).send(buildSuccessMessage(location));
  //   } catch (error) {
  //     //rollback transaction
  //     if (transaction) {
  //       await transaction.rollback();
  //     }
  //     return next(error);
  //   }
  // };

}
