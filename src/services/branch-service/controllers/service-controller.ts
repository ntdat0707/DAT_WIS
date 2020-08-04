import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import * as joi from 'joi';
import _ from 'lodash';
import shortId from 'shortid';

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
import { FindOptions, Transaction } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';
import { ServiceImageModel } from '../../../repositories/postgres/models/service-image';
import { LocationServiceModel } from '../../../repositories/postgres/models/location-service';

export class ServiceController {
  /**
   * @swagger
   * /branch/service/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createService
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: array
   *       items:
   *          type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: cateServiceId
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: name
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: description
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: salePrice
   *       type: integer
   *       required: true
   *     - in: "formData"
   *       name: duration
   *       type: integer
   *       required: true
   *     - in: "formData"
   *       name: color
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: serviceCode
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: staffIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: locationIds
   *       type: array
   *       items:
   *          type: string
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
  public createService = async ({ body, files, query }: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const diff = _.difference(body.locationIds as string[], res.locals.staffPayload.workingLocationIds);
      if (diff.length) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
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
              id: body.locationIds
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

      let serviceCode: string = body.serviceCode;
      if (serviceCode.length > 0) {
        const countServiceCode = await ServiceModel.count({
          where: {
            serviceCode: body.serviceCode
          }
        });
        if (countServiceCode > 0) {
          return next(new CustomError(branchErrorDetails.E_1204(), HttpStatus.BAD_REQUEST));
        }
      } else {
        serviceCode = shortId.generate();
      }

      const data: any = {
        description: body.description,
        salePrice: body.salePrice,
        duration: body.duration,
        color: body.color,
        cateServiceId: body.cateServiceId,
        name: body.name,
        serviceCode: serviceCode
      };

      transaction = await sequelize.transaction();
      const service = await ServiceModel.create(data, { transaction });
      const prepareServiceStaff = (body.staffIds as []).map((id) => ({
        serviceId: service.id,
        staffId: id
      }));
      if (files.length) {
        const images = (files as Express.Multer.File[]).map((x: any, index: number) => ({
          serviceId: service.id,
          path: x.location,
          isAvatar: index === 0 ? true : false
        }));

        await ServiceImageModel.bulkCreate(images, { transaction: transaction });
      }

      /**
       * Prepare location service
       */
      const locationService = (body.locationIds as []).map((locationId: string) => ({
        locationId: locationId,
        serviceId: service.id
      }));

      await LocationServiceModel.bulkCreate(locationService, { transaction: transaction });

      await ServiceStaffModel.bulkCreate(prepareServiceStaff, { transaction });
      await transaction.commit();

      return res.status(HttpStatus.OK).send(buildSuccessMessage(service));
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
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
