import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { MaterialModel, ServiceMaterialModel } from '../../../repositories/postgres/models';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createMaterialSchema, materialIdSchema, updateMaterialSchema } from '../configs/validate-schemas';
import { CustomError } from '../../../utils/error-handlers';
import { materialErrorDetails } from '../../../utils/response-messages/error-details/branch';
import { FindOptions, Op } from 'sequelize';
import { paginate } from '../../../utils/paginator';

export class MaterialController {
  /**
   * @swagger
   * /branch/material/get-all-material:
   *   get:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: getMaterial
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
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public getAllMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const query: FindOptions = {
        where: {
          id: { [Op.ne]: null }
        }
      };
      const materials = await paginate(
        MaterialModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(materials));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/material/get-material/{materialId}:
   *   get:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: getMaterial
   *     parameters:
   *     - in: path
   *       name: materialId
   *       type: string
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
  public getMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.materialId, materialIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const material = await MaterialModel.findOne({ where: { id: req.params.materialId } });
      if (!material) {
        throw new CustomError(
          materialErrorDetails.E_1302(`Material ${req.params.materialId} not found`),
          HttpStatus.NOT_FOUND
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(material));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/material/create-material:
   *   post:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: createMaterial
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: code
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: name
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: unit
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: price
   *       type: integer
   *       required: true
   *     - in: "formData"
   *       name: image
   *       type: file
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
  public createMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        code: req.body.code,
        name: req.body.name,
        unit: req.body.unit,
        price: req.body.price
      };
      const validateErrors = validate(data, createMaterialSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (req.file) {
        data.path = (req.file as any).location;
      } else {
        throw new CustomError(materialErrorDetails.E_1300(`File upload not found`), HttpStatus.NOT_FOUND);
      }
      const checkExistCode = await MaterialModel.findOne({ where: { code: data.code } });
      if (checkExistCode) {
        throw new CustomError(
          materialErrorDetails.E_1301(`material code ${data.code} already exists`),
          HttpStatus.BAD_REQUEST
        );
      }
      const material = await MaterialModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(material));
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * /branch/material/update-material/{materialId}:
   *   put:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: createMaterial
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: materialId
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: code
   *       type: string
   *     - in: "formData"
   *       name: name
   *       type: string
   *     - in: "formData"
   *       name: unit
   *       type: string
   *     - in: "formData"
   *       name: price
   *       type: integer
   *     - in: "formData"
   *       name: image
   *       type: file
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
  public updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        materialId: req.params.materialId,
        code: req.body.code,
        name: req.body.name,
        unit: req.body.unit,
        price: req.body.price
      };
      const validateErrors = validate(data, updateMaterialSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (req.file) {
        data.path = (req.file as any).location;
      }
      const material = await MaterialModel.findOne({ where: { id: data.materialId } });
      if (!material) {
        throw new CustomError(materialErrorDetails.E_1302(`Material ${data.materialId} not found`));
      }
      const existCode = await MaterialModel.findOne({
        where: { code: data.code, id: { [Op.ne]: data.materialId } },
        attributes: ['code']
      });
      if (existCode) {
        throw new CustomError(materialErrorDetails.E_1301(`Material code ${data.code} is already exits`));
      }
      await MaterialModel.update(data, { where: { id: data.materialId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
  /**
   * @swagger
   * /branch/material/delete-material/{materialId}:
   *   delete:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: deleteMaterial
   *     parameters:
   *     - in: path
   *       name: materialId
   *       type: string
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
  public deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.materialId, materialIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const material = await MaterialModel.findOne({ where: { id: req.params.materialId } });
      if (!material) {
        throw new CustomError(materialErrorDetails.E_1302(`Material ${req.params.materialId} not found`));
      }
      await MaterialModel.destroy({ where: { id: req.params.materialId } });
      await ServiceMaterialModel.destroy({ where: { materialId: req.params.materialId } });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
