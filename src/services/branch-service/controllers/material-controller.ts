import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages';

import { MaterialModel } from '../../../repositories/postgres/models';

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
}
