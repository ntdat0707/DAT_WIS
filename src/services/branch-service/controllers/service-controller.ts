import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import * as joi from 'joi';

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createServiceSchema, serviceIdSchema } from '../configs/validate-schemas';
import { ServiceModel } from '../../../repositories/postgres/models/service';
import { StaffModel, LocationModel, sequelize } from '../../../repositories/postgres/models';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { CateServiceModel } from '../../../repositories/postgres/models/cate-service';
import { FindOptions } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';

export class ServiceController {
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
      }).then((staffs) => staffs.map((staff) => staff.id));

      if (!(body.staffIds as []).every((x) => staffIds.includes(x))) {
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
      const prepareServiceStaff = (body.staffIds as []).map((x) => ({
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
   * /branch/service/delete-service/{serviceId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteService
   *     parameters:
   *     - in: path
   *       name: serviceId
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
  public deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const serviceId = req.params.serviceId;
      const validateErrors = validate(serviceId, serviceIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const service = await ServiceModel.findOne({ where: { id: serviceId } });
      if (!service)
        return next(
          new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND)
        );
      if (!workingLocationIds.includes(service.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${service.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await ServiceModel.destroy({ where: { id: serviceId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/service/get-service/{serviceId}:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: get-service
   *     parameters:
   *     - in: path
   *       name: serviceId
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
  public getService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const serviceId = req.params.serviceId;
      const validateErrors = validate(serviceId, serviceIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const service = await ServiceModel.findOne({
        where: {
          id: serviceId
        },
        include: [
          {
            model: LocationModel,
            as: 'location',
            required: true
          },
          {
            model: CateServiceModel,
            as: 'cateService',
            required: true
          },
          {
            model: ServiceResourceModel,
            as: 'serviceResources',
            required: false
          }
        ]
      });
      if (!service)
        return next(
          new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND)
        );
      if (!workingLocationIds.includes(service.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${service.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(service));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/service/get-services:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getServices
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
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const { workingLocationIds } = res.locals.staffPayload;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        where: {
          locationId: workingLocationIds
        }
      };
      const services = await paginate(
        ServiceModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(services));
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
