import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import _ from 'lodash';

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  createServiceSchema,
  serviceIdSchema,
  createServicesSchema,
  getAllServiceSchema,
  updateServiceSchema,
  locationIdSchema
} from '../configs/validate-schemas';
import { ServiceModel } from '../../../repositories/postgres/models/service';
import {
  StaffModel,
  LocationModel,
  sequelize,
  ResourceModel,
  CompanyModel,
  ServiceMaterialModel
} from '../../../repositories/postgres/models';
import { Unaccent } from '../../../utils/unaccent';
import { ServiceStaffModel } from '../../../repositories/postgres/models/service-staff';
import { branchErrorDetails, treatmentErrorDetails } from '../../../utils/response-messages/error-details';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { CateServiceModel } from '../../../repositories/postgres/models/cate-service';
import { FindOptions, Sequelize, Op, Transaction } from 'sequelize';
import { paginateElasticSearch } from '../../../utils/paginator';
import { ServiceImageModel } from '../../../repositories/postgres/models/service-image';
import { LocationServiceModel } from '../../../repositories/postgres/models/location-service';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';
import { esClient } from '../../../repositories/elasticsearch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { ServiceTherapeuticModel } from '../../../repositories/mongo/models/service-therapeutic-model';
import { TherapeuticTreatmentModel } from '../../../repositories/mongo/models/therapeutic-treatment-model';

const { parsed: env } = dotenv.config();

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
   *     - in: "formData"
   *       name: resourceIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: allowGender
   *       type: integer
   *     - in: "formData"
   *       name: extraTimeType
   *       type: string
   *     - in: "formData"
   *       name: extraTimeDuration
   *       type: integer
   *     - in: "formData"
   *       name: therapeuticIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: materials
   *       type: array
   *       items:
   *            type: object
   *            properties:
   *                 materialId:
   *                     type: string
   *                 depreciation:
   *                     type: number
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
  public createService = async ({ body, files }: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const diff = _.difference(body.locationIds as string[], res.locals.staffPayload.workingLocationIds);
      if (diff.length) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
          HttpStatus.FORBIDDEN
        );
      }
      const validateErrors = validate(body, createServiceSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      let serviceCode: string = body.serviceCode;
      if (serviceCode.length > 0) {
        const countServiceCode = await ServiceModel.count({
          where: {
            serviceCode: body.serviceCode
          }
        });
        if (countServiceCode > 0) {
          throw new CustomError(branchErrorDetails.E_1204(), HttpStatus.BAD_REQUEST);
        }
      } else {
        const services: any = await ServiceModel.findAll({
          include: [
            {
              model: LocationModel,
              as: 'locations',
              required: true,
              where: {
                id: res.locals.staffPayload.workingLocationIds
              }
            }
          ]
        });
        const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
        serviceCode = `SER${zeroPad(services.length, 5)}`;
      }

      const data: any = {
        id: uuidv4(),
        description: body.description,
        salePrice: !isNaN(parseInt(body.salePrice, 10)) ? body.salePrice : null,
        duration: body.duration,
        color: body.color,
        cateServiceId: body.cateServiceId,
        name: body.name,
        serviceCode: serviceCode,
        isAllowedMarketplace: body.isAllowedMarketplace,
        allowGender: body.allowGender,
        extraTimeType: body.extraTimeType,
        extraTimeDuration: body.extraTimeDuration,
        therapeuticIds: body.therapeuticIds
      };
      transaction = await sequelize.transaction();
      const service = await ServiceModel.create(data, { transaction });

      if (files.length) {
        const images = (files as Express.Multer.File[]).map((x: any, index: number) => ({
          serviceId: service.id,
          path: x.location,
          isAvatar: index === 0 ? true : false
        }));
        await ServiceImageModel.bulkCreate(images, { transaction: transaction });
      }
      //create Detail Treatment Note
      if (data.therapeuticIds) {
        const therapeutics: any = [];
        for (const therapeuticId of data.therapeuticIds) {
          const therapeutic = await TherapeuticTreatmentModel.findById(therapeuticId).exec();
          if (!therapeutic) {
            throw new CustomError(treatmentErrorDetails.E_3914(`Therapeutic ${therapeuticId} not found`));
          }
          const serviceTherapeuticData = {
            name: therapeutic.name,
            serviceId: service.id,
            therapeuticId: therapeuticId
          };
          const serviceTherapeutic = new ServiceTherapeuticModel(serviceTherapeuticData);
          therapeutics.push(serviceTherapeutic);
        }
        await ServiceTherapeuticModel.insertMany(therapeutics);
      }

      // create service material
      if (body.materials) {
        const materials = (body.materials as []).map((material: any) => ({
          serviceId: service.id,
          materialId: material.materialId,
          depreciation: +material.depreciation
        }));
        await ServiceMaterialModel.bulkCreate(materials, { transaction });
      }

      /**
       * Prepare location service
       */
      const locationServices = (body.locationIds as []).map((locationId: string) => ({
        locationId: locationId,
        serviceId: service.id
      }));
      await LocationServiceModel.bulkCreate(locationServices, { transaction });

      if (body.staffIds && body.staffIds.length > 0) {
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
          throw new CustomError(branchErrorDetails.E_1201(), HttpStatus.BAD_REQUEST);
        }
        const prepareServiceStaff = (body.staffIds as []).map((id) => ({
          serviceId: service.id,
          staffId: id
        }));
        await ServiceStaffModel.bulkCreate(prepareServiceStaff, { transaction });
      }
      if (body.resourceIds && body.resourceIds.length > 0) {
        const serviceResourceData = (body.resourceIds as []).map((x) => ({ resourceId: x, serviceId: service.id }));
        await ServiceResourceModel.bulkCreate(serviceResourceData, { transaction });
      }
      await transaction.commit();
      const serviceData = await ServiceModel.findOne({
        where: {
          id: data.id
        },
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            through: {
              attributes: {
                exclude: ['updatedAt', 'createdAt', 'deletedAt']
              }
            }
          },
          {
            model: CateServiceModel,
            as: 'cateService',
            required: true,
            attributes: {
              exclude: ['updatedAt', 'createdAt', 'deletedAt']
            }
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: false,
            through: {
              attributes: {
                exclude: ['updatedAt', 'createdAt', 'deletedAt']
              }
            }
          },
          {
            model: ServiceImageModel,
            as: 'images',
            required: false
          }
        ]
      }).then((item: any) => {
        const serviceMapping = JSON.parse(JSON.stringify(item));
        serviceMapping.locationServices = serviceMapping.locations.map(
          (location: any) => location.LocationServiceModel
        );
        serviceMapping.serviceStaff = serviceMapping.staffs.map((staff: any) => staff.ServiceStaffModel);
        delete serviceMapping.locations;
        delete serviceMapping.staffs;
        return serviceMapping;
      });
      await esClient.create({
        id: data.id,
        index: env!.ELS_INDEX_GET_SERVICES,
        type: '_doc',
        // version: 1,
        // version_type: 'internal',
        body: serviceData
      });

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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);

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
      // if (!service)
      //   throw new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND);
      if (service) {
        await ServiceModel.destroy({ where: { id: serviceId } });
        await esClient.delete({
          index: env!.ELS_INDEX_GET_SERVICES,
          type: '_doc',
          id: serviceId
        });
      } else {
        const isServiceRemain = await esClient.search({
          index: env!.ELS_INDEX_GET_SERVICES,
          type: '_doc',
          body: {
            query: {
              match: {
                id: serviceId
              }
            }
          }
        });
        if (isServiceRemain.body.hits.total.value === 1) {
          await esClient.delete({
            index: env!.ELS_INDEX_GET_SERVICES,
            type: '_doc',
            id: serviceId
          });
        } else
          throw new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND);
      }
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
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
          },
          {
            model: ServiceImageModel,
            as: 'images',
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: false
          }
        ]
      });
      if (!service)
        throw new CustomError(serviceErrorDetails.E_1203(`serviceId ${serviceId} not found`), HttpStatus.NOT_FOUND);
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
   *     - in: query
   *       name: searchValue
   *       required: false
   *       schema:
   *          type: string
   *     - in: query
   *       name: staffId
   *       required: false
   *       schema:
   *          type: string
   *     - in: query
   *       name: cateServiceId
   *       required: false
   *       schema:
   *          type: string
   *     - in: query
   *       name: locationIds
   *       type: array
   *       items:
   *         type: string
   *       required: true
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
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(locationIdsDiff)}`),
          HttpStatus.FORBIDDEN
        );
      }
      const paginateOptions = {
        pageNum: +req.query.pageNum,
        pageSize: +req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);

      let locationIds: string;
      if (req.query.locationIds && typeof req.query.locationIds !== 'string' && req.query.locationIds.length > 0) {
        locationIds = (req.query.locationIds as []).join(' OR ');
      } else {
        locationIds = workingLocationIds.join(' OR ');
      }

      const searchParams: any = {
        index: env!.ELS_INDEX_GET_SERVICES,
        body: {
          query: {
            bool: {
              must: [
                locationIds
                  ? {
                      query_string: {
                        fields: ['locationServices.locationId'],
                        query: locationIds
                      }
                    }
                  : {
                      match_all: {}
                    }
              ]
            }
          }
        }
      };

      if (req.query.searchValue) {
        const unaccentSearchValue = Unaccent(req.query.searchValue);
        const servicesSearch = await ServiceModel.findAndCountAll({
          where: {
            [Op.or]: [
              Sequelize.literal(`unaccent("ServiceModel"."name") ilike '%${unaccentSearchValue}%'`),
              Sequelize.literal(`unaccent("ServiceModel"."name_en") ilike '%${unaccentSearchValue}%'`),
              Sequelize.literal(`"ServiceModel"."service_code" ilike '%${req.query.searchValue}%'`)
            ]
          }
        });
        const servicesIds: any = [...servicesSearch.rows.map((ids: any) => ids.id)];
        searchParams.body.query.bool.must.push({
          query_string: {
            query: servicesIds.join(' OR ')
            //fields: ['locationServices.serviceId']
          }
        });
      }

      if (req.query.staffId) {
        searchParams.body.query.bool.must.push({
          query_string: {
            fields: ['serviceStaff.staffId'],
            query: `${req.query.staffId}`
          }
        });
      }

      if (req.query.cateServiceId) {
        searchParams.body.query.bool.must.push({
          query_string: {
            fields: ['cateService.id'],
            query: `${req.query.cateServiceId}`
          }
        });
      }

      const services = await paginateElasticSearch(esClient, searchParams, paginateOptions, fullPath);
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
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const locationIdsDiff = _.difference(data.locationIds as string[], workingLocationIds);
      if (locationIdsDiff.length > 0) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(locationIdsDiff)}`),
          HttpStatus.FORBIDDEN
        );
      }
      const query: FindOptions = {
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            where: {
              id: (data.locationIds as [])?.length ? data.locationIds : workingLocationIds
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
      const validateErrors = validate(req.body, createServicesSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (!res.locals.staffPayload.workingLocationIds.includes(req.body.locationId))
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
          HttpStatus.FORBIDDEN
        );
      const cateService = await CateServiceModel.findOne({
        where: {
          id: req.body.cateServiceId,
          companyId: res.locals.staffPayload.companyId
        }
      });
      if (!cateService) {
        throw new CustomError(
          branchErrorDetails.E_1205(`${req.body.cateServiceId} out of company`),
          HttpStatus.FORBIDDEN
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
        throw new CustomError(branchErrorDetails.E_1201(), HttpStatus.BAD_REQUEST);
      }

      transaction = await sequelize.transaction();
      for (let i = 0; i < req.body.serviceDetails.length; i++) {
        const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
        const data = {
          salePrice: !isNaN(parseInt(req.body.serviceDetails[i].salePrice, 10))
            ? req.body.serviceDetails[i].salePrice
            : null,
          duration: req.body.serviceDetails[i].duration,
          cateServiceId: req.body.cateServiceId,
          name: req.body.serviceDetails[i].name,
          serviceCode: `SER${zeroPad(i + 1, 5)}`
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
      const company = await CompanyModel.findOne({ where: { id: res.locals.staffPayload.companyId } });
      await StaffModel.update({ onboardStep: 4 }, { where: { id: company.ownerId }, transaction });
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

  /**
   * @swagger
   * /branch/service/update/{serviceId}:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: updateService
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: serviceId
   *       required: true
   *       schema:
   *          type: string
   *     - in: "formData"
   *       name: "photo"
   *       type: array
   *       items:
   *          type: file
   *       description: The file to upload.
   *     - in: "formData"
   *       name: cateServiceId
   *       type: string
   *     - in: "formData"
   *       name: name
   *       type: string
   *     - in: "formData"
   *       name: description
   *       type: string
   *     - in: "formData"
   *       name: salePrice
   *       type: integer
   *     - in: "formData"
   *       name: duration
   *       type: integer
   *     - in: "formData"
   *       name: color
   *       type: string
   *     - in: "formData"
   *       name: serviceCode
   *       type: string
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
   *     - in: "formData"
   *       name: deleteImages
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: isAllowedMarketplace
   *       type: boolean
   *     - in: "formData"
   *       name: status
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: resourceIds
   *       type: array
   *       items:
   *          type: string
   *     - in: "formData"
   *       name: allowGender
   *       type: integer
   *     - in: "formData"
   *       name: extraTimeType
   *       type: string
   *     - in: "formData"
   *       name: extraTimeDuration
   *       type: integer
   *     - in: "formData"
   *       name: therapeuticIds
   *       type: array
   *       items:
   *           type: string
   *     - in: "formData"
   *       name: materials
   *       type: array
   *       items:
   *           type: object
   *           properties:
   *              materialId:
   *                    type: string
   *              depreciation:
   *                    type: number
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
  public updateService = async ({ params, body, files }: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      body.serviceId = params.serviceId;
      const validateErrors = validate(body, updateServiceSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const service = await ServiceModel.findOne({
        where: {
          id: params.serviceId
        }
      });
      if (!service) {
        throw new CustomError(
          serviceErrorDetails.E_1203(`Service ${params.serviceId} not exist`),
          HttpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
      if (body.locationIds && body.locationIds.length > 0) {
        const diff = _.difference(body.locationIds as string[], res.locals.staffPayload.workingLocationIds);
        if (diff.length) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${JSON.stringify(diff)}`),
            HttpStatus.FORBIDDEN
          );
        }
        const curLocationServices = await LocationServiceModel.findAll({ where: { serviceId: params.serviceId } });
        const curLocationIds = curLocationServices.map((location) => location.locationId);
        const removeLocationIds = _.difference(curLocationIds, body.locationIds);
        if (removeLocationIds.length > 0) {
          await LocationServiceModel.destroy({
            where: { serviceId: params.serviceId, locationId: removeLocationIds },
            transaction
          });
        }
        const addLocationIds = _.difference(body.locationIds, curLocationIds);
        if (addLocationIds.length > 0) {
          const locationService = (addLocationIds as []).map((locationId: string) => ({
            locationId: locationId,
            serviceId: service.id
          }));
          await LocationServiceModel.bulkCreate(locationService, { transaction: transaction });
        }
      }
      if (body.staffIds && body.staffIds.length > 0) {
        const curServiceStaff = await ServiceStaffModel.findAll({
          where: { serviceId: params.serviceId },
          transaction
        });
        const currentStaffIds = curServiceStaff.map((staff) => staff.staffId);
        const removeStaffIds = _.difference(currentStaffIds, body.staffIds);
        if (removeStaffIds.length > 0) {
          await ServiceStaffModel.destroy({
            where: { serviceId: params.serviceId, staffId: removeStaffIds },
            transaction
          });
        }
        const addStaffIds = _.difference(body.staffIds, currentStaffIds);
        if (addStaffIds.length > 0) {
          const staffs = await StaffModel.findAll({
            where: { id: addStaffIds },
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
          if (!(addStaffIds as []).every((x) => staffIds.includes(x))) {
            throw new CustomError(branchErrorDetails.E_1201(), HttpStatus.BAD_REQUEST);
          }
          const prepareServiceStaff = (addStaffIds as []).map((id) => ({
            serviceId: service.id,
            staffId: id
          }));
          await ServiceStaffModel.bulkCreate(prepareServiceStaff, { transaction });
        }
      }

      if (body.resourceIds && body.resourceIds.length > 0) {
        const curServiceResources = await ServiceResourceModel.findAll({
          where: { serviceId: params.serviceId },
          transaction
        });
        const currentResourceIds = curServiceResources.map((resource) => resource.resourceId);
        const removeResourceIds = _.difference(currentResourceIds, body.resourceIds);
        if (removeResourceIds.length > 0) {
          await ServiceResourceModel.destroy({
            where: { serviceId: params.serviceId, resourceId: removeResourceIds },
            transaction
          });
        }
        const addResourceIds = _.difference(body.resourceIds, currentResourceIds);
        if (addResourceIds.length > 0) {
          const serviceResource = (addResourceIds as []).map((resourceId: string) => ({
            resourceId: resourceId,
            serviceId: service.id
          }));
          await ServiceResourceModel.bulkCreate(serviceResource, { transaction: transaction });
        }
      }
      //check service therapeutic ids
      if (!body.therapeuticIds) {
        body.therapeuticIds = [];
      }
      for (const therapeuticId of body.therapeuticIds) {
        const therapeutic = await TherapeuticTreatmentModel.findById(therapeuticId).exec();
        if (!therapeutic) {
          throw new CustomError(treatmentErrorDetails.E_3914(`Therapeutic ${therapeuticId} not found`));
        }
      }
      const serviceTherapeuticIds = await ServiceTherapeuticModel.find({ serviceId: service.id }).exec();
      const currTherapeuticIds = serviceTherapeuticIds.map((item: any) => item.therapeuticId.toString());
      const removeTherapeuticIds = _.difference(currTherapeuticIds, body.therapeuticIds);
      if (removeTherapeuticIds.length > 0) {
        await ServiceTherapeuticModel.deleteMany({
          therapeuticId: { $in: removeTherapeuticIds },
          serviceId: service.id
        }).exec();
      }
      const addTherapeuticIds = _.difference(body.therapeuticIds, currTherapeuticIds);
      if (addTherapeuticIds.length > 0) {
        const therapeutics = (await TherapeuticTreatmentModel.find({ _id: { $in: addTherapeuticIds } }).exec()).map(
          (item: any) => ({
            name: item.name,
            therapeuticId: item._id,
            serviceId: service.id
          })
        );
        await ServiceTherapeuticModel.insertMany(therapeutics);
      }
      // check materials
      if (body.materials) {
        const currMaterials = await ServiceMaterialModel.findAll({
          where: { serviceId: service.id },
          attributes: ['material_id', 'depreciation']
        });
        const removeMaterials: any = _.difference(currMaterials, body.materials);
        if (removeMaterials.length > 0) {
          await ServiceMaterialModel.destroy({
            where: { serviceId: service.id, materialId: removeMaterials },
            transaction
          });
        }
        const addMaterials: any = _.difference(body.materials, currMaterials);
        if (addMaterials.length > 0) {
          const materials = (addMaterials as []).map((materialId: string) => ({
            materialId: materialId,
            serviceId: service.id
          }));
          await ServiceMaterialModel.bulkCreate(materials, { transaction });
        }
      }
      const data: any = {
        description: body.description,
        salePrice: !isNaN(parseInt(body.salePrice, 10)) ? body.salePrice : service.salePrice,
        duration: body.duration ? body.duration : service.duration,
        color: body.color ? body.color : service.color,
        cateServiceId: body.cateServiceId ? body.cateServiceId : service.cateServiceId,
        name: body.name ? body.name : service.name,
        serviceCode: body.serviceCode ? body.serviceCode : service.serviceCode,
        isAllowedMarketplace: body.isAllowedMarketplace,
        status: body.status,
        allowGender: body.allowGender ? body.allowGender : service.allowGender,
        extraTimeType: body.extraTimeType ? body.extraTimeType : service.extraTimeType,
        extraTimeDuration: body.extraTimeDuration ? body.extraTimeDuration : service.extraTimeDuration
      };

      let isDeletedAvatar = false;
      if (body.deleteImages && body.deleteImages.length > 0) {
        const serviceImages = await ServiceImageModel.findAll({
          where: {
            id: body.deleteImages
          }
        });
        if (body.deleteImages.length !== serviceImages.length) {
          throw new CustomError(serviceErrorDetails.E_1206(), HttpStatus.NOT_FOUND);
        }

        for (let i = 0; i < serviceImages.length; i++) {
          if (serviceImages[i].isAvatar) {
            isDeletedAvatar = true;
          }
        }

        await ServiceImageModel.destroy({ where: { id: body.deleteImages }, transaction });
      }

      if (files.length) {
        const images = (files as Express.Multer.File[]).map((x: any, index: number) => ({
          serviceId: service.id,
          path: x.location,
          isAvatar: index === 0 && isDeletedAvatar ? true : false
        }));
        await ServiceImageModel.bulkCreate(images, { transaction: transaction });
      }
      await ServiceModel.update(data, {
        where: {
          id: params.serviceId
        },
        transaction
      });
      await transaction.commit();

      const serviceData = await ServiceModel.findOne({
        where: {
          id: params.serviceId
        },
        include: [
          {
            model: LocationModel,
            as: 'locations',
            required: true,
            through: {
              attributes: {
                exclude: ['updatedAt', 'createdAt', 'deletedAt']
              }
            }
          },
          {
            model: CateServiceModel,
            as: 'cateService',
            required: true,
            attributes: {
              exclude: ['updatedAt', 'createdAt', 'deletedAt']
            }
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: false,
            through: {
              attributes: {
                exclude: ['updatedAt', 'createdAt', 'deletedAt']
              }
            }
          },
          {
            model: ServiceImageModel,
            as: 'images',
            required: false
          }
        ]
      }).then((item: any) => {
        const serviceMapping = JSON.parse(JSON.stringify(item));
        serviceMapping.locationService = serviceMapping.locations.map((location: any) => location.LocationServiceModel);
        serviceMapping.serviceStaff = serviceMapping.staffs.map((staff: any) => staff.ServiceStaffModel);
        delete serviceMapping.locations;
        delete serviceMapping.staffs;
        return serviceMapping;
      });

      await esClient.update({
        id: params.serviceId,
        index: env!.ELS_INDEX_GET_SERVICES,
        body: {
          doc: serviceData,
          doc_as_upsert: true
        },
        type: '_doc'
      });

      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/service/search-services:
   *   get:
   *     tags:
   *       - Branch
   *     name: searchService
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public searchService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services: any = await ServiceModel.findAll({ order: ['name', 'ASC'] });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(services));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/service/market-place/get-services/{locationId}:
   *   get:
   *     tags:
   *       - Branch
   *     name: getServicesByLocation
   *     parameters:
   *     - in: path
   *       name: locationId
   *       type: string
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getServicesByLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.locationId, locationIdSchema);
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);

      const serviceLocationIds: any = await LocationServiceModel.findAll({
        raw: true,
        where: { locationId: req.params.locationId },
        attributes: ['id', 'service_id', 'location_id']
      });
      const locationInfor: any = await LocationModel.findOne({
        where: { id: req.params.locationId },
        attributes: ['id', 'company_id'],
        raw: true
      });

      const serviceIds = serviceLocationIds.map((serviceId: any) => serviceId.service_id);
      const cateServices = await CateServiceModel.findAll({
        where: { companyId: locationInfor.company_id },
        attributes: ['id', 'name'],
        include: [
          {
            model: ServiceModel,
            as: 'services',
            required: true,
            attributes: ['id', 'name', 'duration', 'sale_price'],
            where: { id: serviceIds }
          }
        ],
        group: ['CateServiceModel.id', 'services.id', 'services.duration', 'services.name', 'services.sale_price']
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateServices));
    } catch (error) {
      return next(error);
    }
  };
}
