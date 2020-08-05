import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import * as joi from 'joi';
import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createResourceSchema, resourceIdSchema, updateResourceSchema } from '../configs/validate-schemas/resource';
import { ResourceModel, LocationModel, ServiceModel, sequelize } from '../../../repositories/postgres/models';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';
import { resourceErrorDetails } from '../../../utils/response-messages/error-details/branch/resource';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import { FindOptions, Transaction } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';

export class ResourceController {
  /**
   * @swagger
   * definitions:
   *   CreateResource:
   *       required:
   *           - locationId
   *           - description
   *       properties:
   *           name:
   *               type: string
   *           excerpt:
   *               type: string
   *           locationId:
   *               type: string
   *           description:
   *               type: string
   *           serviceIds:
   *               type: array
   *               items:
   *                  type: string
   *
   */

  /**
   * @swagger
   * /branch/resource/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createResource
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateResource'
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
  public createResource = async ({ body }: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const validateErrors = validate(body, createResourceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const data: any = {
        locationId: body.locationId,
        description: body.description,
        excerpt: body.excerpt,
        name: body.name
      };
      transaction = await sequelize.transaction();
      const resource = await ResourceModel.create(data, { transaction });
      const serviceResourceData = (body.serviceIds as []).map((x) => ({ serviceId: x, resourceId: resource.id }));
      await ServiceResourceModel.bulkCreate(serviceResourceData, { transaction });
      await transaction.commit();

      return res.status(HttpStatus.OK).send(buildSuccessMessage(resource));
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/resource/delete-resource/{resourceId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteResource
   *     parameters:
   *     - in: path
   *       name: resourceId
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
  public deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const resourceId = req.params.resourceId;
      const validateErrors = validate(resourceId, resourceIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const resource = await ResourceModel.findOne({ where: { id: resourceId } });
      if (!resource)
        return next(
          new CustomError(resourceErrorDetails.E_1101(`resourceId ${resourceId} not found`), HttpStatus.NOT_FOUND)
        );
      if (!workingLocationIds.includes(resource.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${resource.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await ResourceModel.destroy({ where: { id: resourceId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/resource/get-resources:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getResources
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
  public getResources = async (req: Request, res: Response, next: NextFunction) => {
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
        include: [
          {
            model: LocationModel,
            as: 'location',
            required: true
          }
        ],
        where: {
          locationId: workingLocationIds
        }
      };
      const resources = await paginate(
        ResourceModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(resources));
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * /branch/resource/{serviceId}/all:
   *   get:
   *     summary: Get all resource of one service.
   *     description: Get all resource of one service.
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getResourcesInService
   *     parameters:
   *     - in: path
   *       name: serviceId
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
  public getResourcesInService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(
        req.params,
        joi.object({
          serviceId: joi.string().required()
        })
      );
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const resourcesInService = await ResourceModel.findAll({
        include: [
          {
            model: ServiceModel,
            as: 'services',
            attributes: [],
            where: {
              id: req.params.serviceId
            },
            through: {
              attributes: []
            }
          }
        ]
      });

      return res.status(HttpStatus.OK).send(buildSuccessMessage(resourcesInService));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/resource/get-resource/{resourceId}:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getResource
   *     parameters:
   *     - in: path
   *       name: resourceId
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
  public getResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const resourceId = req.params.resourceId;
      const validateErrors = validate(resourceId, resourceIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const resource = await ResourceModel.findOne({
        where: {
          id: resourceId
        },
        include: [
          {
            model: LocationModel,
            as: 'location',
            required: true
          },
          {
            model: ServiceModel,
            as: 'services',
            required: false
          }
        ]
      });
      if (!resource)
        return next(
          new CustomError(resourceErrorDetails.E_1101(`resourceId ${resourceId} not found`), HttpStatus.NOT_FOUND)
        );
      if (!workingLocationIds.includes(resource.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${resource.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(resource));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateResource:
   *       required:
   *           - resourceId
   *       properties:
   *           resourceId:
   *               type: string
   *           name:
   *               type: string
   *           excerpt:
   *               type: string
   *           description:
   *               type: string
   *           serviceIds:
   *               type: array
   *               items:
   *                  type: string
   *
   */
  /**
   * @swagger
   * /branch/resource/update:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: updateResource
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateResource'
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
  public updateResource = async ({ body }: Request, res: Response, next: NextFunction) => {
    let transaction: Transaction;
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const validateErrors = validate(body, updateResourceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const resource = await ResourceModel.findOne({
        where: {
          id: body.resourceId
        }
      });
      if (!resource)
        return next(
          new CustomError(resourceErrorDetails.E_1101(`resourceId ${body.resourceId} not found`), HttpStatus.NOT_FOUND)
        );
      if (!workingLocationIds.includes(resource.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${resource.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const data: any = {
        description: body.description,
        excerpt: body.excerpt,
        name: body.name
      };
      transaction = await sequelize.transaction();
      await ServiceResourceModel.destroy({ where: { resourceId: body.resourceId } });
      await ResourceModel.update(data, { where: { id: body.resourceId } });
      const serviceResourceData = (body.serviceIds as []).map((x) => ({ serviceId: x, resourceId: body.resourceId }));
      await ServiceResourceModel.bulkCreate(serviceResourceData, { transaction });
      await transaction.commit();

      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };
}
