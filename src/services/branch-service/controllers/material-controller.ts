import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { MaterialModel } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { createMaterialSchema } from '../configs/validate-schemas';
import { CustomError } from '../../../utils/error-handlers';

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
   * /branch/material/get-all-material:
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
   *       name: materialId
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: materailName
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
      const data = {
        code: req.body.materialId,
        name: req.body.name,
        unit: req.body.unit,
        price: req.body.price
      };
      const validateErrors = validate(data, createMaterialSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      return next(error);
    }
  };
}
