import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import _ from 'lodash';
import shortId from 'shortid';

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import {
  createServiceSchema,
  serviceIdSchema,
  createServicesSchema,
  getAllServiceSchema
} from '../configs/validate-schemas';
import { ServiceModel } from '../../../repositories/postgres/models/service';
import { StaffModel, LocationModel, sequelize, ResourceModel } from '../../../repositories/postgres/models';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { CateServiceModel } from '../../../repositories/postgres/models/cate-service';
import { FindOptions, Transaction } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';
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
   *       required: true
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: locationIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: isAllowedMarketplace
   *       type: boolean
   *       required: true
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
      const staffs = await StaffModel.findAll({
        where: { id: body.staffIds },
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
      });
      const staffIds = staffs.map((staff) => staff.id);
      // .then((staffs) => staffs.map((staff) => staff.id));

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
        salePrice: !isNaN(parseInt(body.salePrice, 10)) ? body.salePrice : null,
        duration: body.duration,
        color: body.color,
        cateServiceId: body.cateServiceId,
        name: body.name,
        serviceCode: serviceCode,
        isAllowedMarketplace: body.isAllowedMarketplace
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
      const service: any = await ServiceModel.findOne({
        where: { id: serviceId },
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            where: {
              id: workingLocationIds
            }
          }
        ]
      });
      if (!service)
        return next(
          new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND)
        );

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
      const service: any = await ServiceModel.findOne({
        where: {
          id: serviceId
        },
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            where: {
              id: workingLocationIds
            }
          },
          {
            model: CateServiceModel,
            as: 'cateService',
            required: true
          },
          {
            model: ResourceModel,
            as: 'resources',
            required: false
          }
        ]
      });
      if (!service)
        return next(
          new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND)
        );
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
   *       name: locationIds
   *       type: array
   *       items:
   *         type: string
   *       required: true
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
      const locationIdsDiff = _.difference(req.query.locationIds as string[], workingLocationIds);
      if (locationIdsDiff.length > 0) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(locationIdsDiff)}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            where: {
              id: (req.query.locationIds as []).length ? req.query.locationIds : workingLocationIds
            }
          }
        ]
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
   * /branch/service/all:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getAllService
   *     parameters:
   *     - in: query
   *       name: locationIds
   *       type: array
   *       items:
   *        type: string
   *       required: true
   *     - in: query
   *       name: staffId
   *       type: string
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
      const { workingLocationIds } = res.locals.staffPayload;
      const data = {
        locationIds: req.query.locationIds,
        staffId: req.query.staffId
      };
      const validateErrors = validate(data, getAllServiceSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const locationIdsDiff = _.difference(data.locationIds as string[], workingLocationIds);
      if (locationIdsDiff.length > 0) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(locationIdsDiff)}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const query: FindOptions = {
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            where: {
              id: (data.locationIds as []).length ? data.locationIds : workingLocationIds
            }
          }
        ]
      };
      if (data.staffId) {
        query.include.push({
          model: StaffModel,
          as: 'staffs',
          required: true,
          where: {
            id: data.staffId
          },
          attributes: []
        });
      }
      const servicesInLocation = await ServiceModel.findAll(query);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(servicesInLocation));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateServiceDetail:
   *       required:
   *           - name
   *           - salePrice
   *           - duration
   *       properties:
   *           name:
   *               type: string
   *           salePrice:
   *               type: integer
   *           duration:
   *               type: integer
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateServices:
   *       required:
   *           - cateServiceId
   *           - locationId
   *           - serviceDetails
   *           - staffIds
   *       properties:
   *           cateServiceId:
   *               type: string
   *           locationId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *           serviceDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateServiceDetail'
   *
   */
  /**
   * @swagger
   * /branch/service/create-services:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createServices
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateServices'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       403:
   *         description: forbidden
   *       500:
   *         description: Server internal error
   */
  public createServices = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      transaction = await sequelize.transaction();
      const validateErrors = validate(req.body, createServicesSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      if (!res.locals.staffPayload.workingLocationIds.includes(req.body.locationId))
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      const cateService = await CateServiceModel.findOne({
        where: {
          id: req.body.cateServiceId,
          companyId: res.locals.staffPayload.companyId
        }
      });
      if (!cateService) {
        return next(
          new CustomError(branchErrorDetails.E_1205(`${req.body.cateServiceId} out of company`), HttpStatus.FORBIDDEN)
        );
      }
      const staffIds = await StaffModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            where: {
              id: req.body.locationId
            },
            through: {
              attributes: ['id']
            }
          }
        ]
      }).then((staffs) => staffs.map((staff) => staff.id));

      if (!(req.body.staffIds as []).every((x) => staffIds.includes(x))) {
        return next(new CustomError(branchErrorDetails.E_1201(), HttpStatus.BAD_REQUEST));
      }

      transaction = await sequelize.transaction();
      for (let i = 0; i < req.body.serviceDetails.length; i++) {
        const data = {
          salePrice: !isNaN(parseInt(req.body.serviceDetails[i].salePrice, 10))
            ? req.body.serviceDetails[i].salePrice
            : null,
          duration: req.body.serviceDetails[i].duration,
          cateServiceId: req.body.cateServiceId,
          name: req.body.serviceDetails[i].name,
          serviceCode: shortId.generate()
        };
        const service = await ServiceModel.create(data, { transaction });
        const serviceStaff = (req.body.staffIds as []).map((id) => ({
          serviceId: service.id,
          staffId: id
        }));
        const locationService = {
          locationId: req.body.locationId,
          serviceId: service.id
        };
        await LocationServiceModel.create(locationService, { transaction: transaction });
        await ServiceStaffModel.bulkCreate(serviceStaff, { transaction });
      }

      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };
}
