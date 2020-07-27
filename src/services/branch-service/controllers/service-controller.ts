import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createServiceSchema } from '../configs/validate-schemas';
import { ServiceModel } from '../../../repositories/postgres/models/service';
import { StaffModel, LocationModel, sequelize } from '../../../repositories/postgres/models';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import * as joi from 'joi';

export class ServiceController {
  constructor() {}
  /**
   * @swagger
   * definitions:
   *   createService:
   *       required:
   *           - locationId
   *           - description
   *           - salePrice
   *           - color
   *           - duration
   *           - cateServiceId
   *       properties:
   *           locationId:
   *               type: string
   *           description:
   *               type: string
   *           cateServiceId:
   *               type: string
   *           salePrice:
   *               type: integer
   *           duration:
   *               type: integer
   *           color:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                  type: string
   *
   */

  /**
   * @swagger
   * /branch/service/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createService
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/createService'
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
  public createService = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(body, createServiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const staffIds = await StaffModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            where: {
              id: body.locationId
            },
            through: {
              attributes: ['id']
            }
          }
        ]
      }).then(staffs => staffs.map(staff => staff.id));

      if (!(body.staffIds as []).every(x => staffIds.includes(x))) {
        return next(new CustomError(branchErrorDetails.E_1201(), HttpStatus.BAD_REQUEST));
      }
      const data: any = {
        locationId: body.locationId,
        description: body.description,
        salePrice: body.salePrice,
        duration: body.duration,
        color: body.color,
        cateServiceId: body.cateServiceId
      };

      const transaction = await sequelize.transaction();
      const service = await ServiceModel.create(data, { transaction });
      const prepareServiceStaff = (body.staffIds as []).map(x => ({
        serviceId: service.id,
        staffId: x
      }));
      await ServiceStaffModel.bulkCreate(prepareServiceStaff, { transaction });
      await transaction.commit();

      return res.status(HttpStatus.OK).send(buildSuccessMessage(service));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/service/{locationId}/all:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getAllService
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(
        req.params,
        joi.object({
          locationId: joi.string().required()
        })
      );
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const servicesInLocation = await ServiceModel.findAll({
        where: { locationId: req.params.locationId }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(servicesInLocation));
    } catch (error) {
      return next(error);
    }
  };
}
