import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { PipelineModel, PipelineStageModel, sequelize } from '../../../repositories/postgres/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createPipelineSchema, updatePipelineSchema, pipelineIdSchema } from '../configs/validate-schemas/deal';
import { pipelineErrorDetails } from '../../../utils/response-messages/error-details';

export class DealCotroller {
  /**
   * @swagger
   * /customer/deal/all-pipeline:
   *   get:
   *     summary: Get all pipeline
   *     description: Get all pipeline
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: pipeline
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllPipeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pipeline = await PipelineModel.findAll();
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipeline));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   pipelineCreate:
   *       properties:
   *           staffId:
   *               type: string
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   */

  /**
   * @swagger
   * /customer/deal/create-pipeline:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createPipeline
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/pipelineCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPipeline = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const data: any = {
        staffId: req.body.staffId,
        name: req.body.name,
        rottingIn: req.body.rottingIn
      };
      const validateErrors = validate(data, createPipelineSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const pipeline = await PipelineModel.create(data, { transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipeline));
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
   * definitions:
   *   pipelineUpdate:
   *       properties:
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *
   */

  /**
   * @swagger
   * /customer/deal/update-pipeline/{pipelineId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updatePipeline
   *     parameters:
   *     - in: "path"
   *       name: "pipelineId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/pipelineUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updatePipeline = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const pipelineId = req.params.pipelineId;
      const data: any = {
        name: req.body.name,
        rottingIn: req.body.rottingIn
      };
      const validateErrors = validate(data, updatePipelineSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let pipeline = await PipelineModel.findOne({ where: { id: pipelineId } });
      if (!pipeline) {
        throw new CustomError(pipelineErrorDetails.E_3101(`pipelineId ${pipelineId} not found`), httpStatus.NOT_FOUND);
      }
      pipeline = await pipeline.update(data, { transaction });
      transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipeline));
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
   * /customer/deal/delete-pipeline/{pipelineId}:
   *   delete:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: deletePipeline
   *     parameters:
   *     - in: path
   *       name: pipelineId
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
  public deletePipeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pipelineId = req.params.pipelineId;
      const validateErrors = validate(pipelineId, pipelineIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const pipeline = await PipelineModel.findOne({ where: { id: pipelineId } });
      if (!pipeline) {
        return next(
          new CustomError(pipelineErrorDetails.E_3101(`pipelineId ${pipelineId} not found`), httpStatus.NOT_FOUND)
        );
      }
      const pipelineStage = await PipelineStageModel.findOne({ where: { pipelineId: pipelineId } });
      if (pipelineStage) {
        await PipelineStageModel.destroy({ where: { pipelineId: pipelineId } });
      }
      await PipelineModel.destroy({ where: { id: pipelineId } });
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
