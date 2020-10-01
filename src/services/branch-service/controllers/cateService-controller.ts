import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { branchErrorDetails } from '../../../utils/response-messages/error-details';
import { paginate } from '../../../utils/paginator';

import { createCateServiceSchema, updateCateServiceSchema, cateServiceIdSchema } from '../configs/validate-schemas';
import { CateServiceModel } from '../../../repositories/postgres/models/cate-service';

export class CateServiceController {
  /**
   * @swagger
   * definitions:
   *   createCateService:
   *       required:
   *           - name
   *           - excerpt
   *       properties:
   *           name:
   *               type: string
   *           excerpt:
   *               type: string
   *           color:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/cate-service/create:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createCateService
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/createCateService'
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
  public createCateService = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        name: body.name,
        excerpt: body.excerpt,
        companyId: res.locals.staffPayload.companyId,
        color: body.color
      };
      const validateErrors = validate(data, createCateServiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      const cateService = await CateServiceModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateService));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/cate-service/get-all-cate-service:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getAllCateServices
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllCateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      console.log('CompanyId::',companyId);
      const cateService = await CateServiceModel.findAll({ where: { companyId } });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateService));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   updateCateService:
   *       required:
   *           - id
   *           - name
   *           - excerpt
   *       properties:
   *           id:
   *               type: string
   *           name:
   *               type: string
   *           excerpt:
   *               type: string
   *           color:
   *               type: string
   *
   */

  /**
   * @swagger
   * /branch/cate-service/update:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: UpdateCateService
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/updateCateService'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       404:
   *         description: service cate gory not found
   *       500:
   *         description: internal error
   */
  public updateCateService = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        id: body.id,
        name: body.name,
        excerpt: body.excerpt,
        companyId: res.locals.staffPayload.companyId,
        color: body.color
      };
      const validateErrors = validate(data, updateCateServiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const serviceCategoryStoraged = await CateServiceModel.findOne({
        where: {
          id: data.id,
          companyId: data.companyId
        }
      });
      if (!serviceCategoryStoraged)
        return next(
          new CustomError(
            branchErrorDetails.E_1205(`Can not find cateService ${data.id} in company ${data.companyId}`),
            HttpStatus.NOT_FOUND
          )
        );
      await CateServiceModel.update(data, { where: { id: data.id } });
      const cateService = await CateServiceModel.findOne({
        where: {
          id: data.id,
          companyId: data.companyId
        }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateService));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/cate-service/get/{cateServiceId}:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getCateService
   *     parameters:
   *     - in: path
   *       name: cateServiceId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       404:
   *         description: service cate gory not found
   *       500:
   *         description: internal error
   */
  public getCateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const validateErrors = validate(req.params.cateServiceId, cateServiceIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const cateService = await CateServiceModel.findOne({
        where: {
          id: req.params.cateServiceId,
          companyId: companyId
        }
      });
      if (!cateService)
        return next(
          new CustomError(
            branchErrorDetails.E_1205(`Can not find cateService ${req.params.cateServiceId} in company ${companyId}`),
            HttpStatus.NOT_FOUND
          )
        );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateService));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/cate-service/get-cate-services:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: getCateServices
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
   *         description: bad request
   *       404:
   *         description: service cate gory not found
   *       500:
   *         description: internal error
   */
  public getCateServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      const query = {
        where: {
          companyId: companyId
        }
      };
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const cateServices = await paginate(
        CateServiceModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cateServices));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/cate-service/delete/{cateServiceId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteCateService
   *     parameters:
   *     - in: path
   *       name: cateServiceId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       404:
   *         description: service cate gory not found
   *       500:
   *         description: internal error
   */
  public deleteCateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const cateServiceId = req.params.cateServiceId;
      const validateErrors = validate(req.params.cateServiceId, cateServiceIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const cateService = await CateServiceModel.findOne({
        where: {
          id: cateServiceId,
          companyId: companyId
        }
      });
      if (!cateService)
        return next(
          new CustomError(
            branchErrorDetails.E_1205(`Can not find cateService ${cateServiceId} in company ${companyId}`),
            HttpStatus.NOT_FOUND
          )
        );
      await CateServiceModel.destroy({ where: { id: cateServiceId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

}
