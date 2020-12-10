import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { MaterialModel } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { createMaterialSchema } from '../configs/validate-schemas';
import { CustomError } from '../../../utils/error-handlers';
import { materialErrorDetails } from '../../../utils/response-messages/error-details/branch';

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
      const materials = await MaterialModel.findAll();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(materials));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/material/get-material:
   *   get:
   *     tags:
   *       - Material
   *     security:
   *       - Bearer: []
   *     name: getMaterial
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
      const materials = await MaterialModel.findAll();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(materials));
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
}
