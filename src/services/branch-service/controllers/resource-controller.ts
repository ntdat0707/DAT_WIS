import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createResourceSchema, resourceIdSchema } from '../configs/validate-schemas/resource';
import { ResourceModel, LocationModel } from '../../../repositories/postgres/models';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';
import { resourceErrorDetails } from '../../../utils/response-messages/error-details/branch/resource';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import { FindOptions } from 'sequelize/types';
import { paginate } from '../../../utils/paginator';

export class ResourceController {
  constructor() {}

  /**
   * @swagger
   * definitions:
   *   CreateResource:
   *       required:
   *           - locationId
   *           - description
   *       properties:
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
    try {
      console.log(res.locals.staffPayload);

      const validateErrors = validate(body, createResourceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const data: any = {
        locationId: body.locationId,
        description: body.description
      };
      const resource = await ResourceModel.create({ locationId: body.locationId, description: body.description });
      const serviceResourceData = (body.serviceIds as []).map(x => ({ serviceId: x, resourceId: resource.id }));
      const resourceService = await ServiceResourceModel.bulkCreate(serviceResourceData);

      return res.status(HttpStatus.OK).send(buildSuccessMessage(resource));
    } catch (error) {
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
}
