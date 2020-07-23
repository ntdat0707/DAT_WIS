import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { createResourceSchema, resourceIdSchema } from '../configs/validate-schemas/resource';
import { ResourceModel } from '../../../repositories/postgres/models';
import { ServiceResourceModel } from '../../../repositories/postgres/models/service-resource';
import { resourceErrorDetails } from '../../../utils/response-messages/error-details/branch/resource';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';

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
      console.log(serviceResourceData);
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
}
