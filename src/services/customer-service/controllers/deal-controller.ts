import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { PipelineModel, PipelineStageModel, sequelize } from '../../../repositories/postgres/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { 
  createPipelineSchema,
  updatePipelineSchema,
  pipelineIdSchema,
  createPipelineStageSchema,
  updatePipelineStageSchema,
  pipelineStageIdSchema,
  settingPipelineStageSchema
} from '../configs/validate-schemas/deal';
import { pipelineErrorDetails, pipelineStageErrorDetails } from '../../../utils/response-messages/error-details/pipeline';

export class DealController {
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
      const staffId = res.locals.staffPayload.id;
      const pipeline = await PipelineModel.findAll({ where: { staffId: staffId } });
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
        name: req.body.name,
        rottingIn: req.body.rottingIn
      };
      const validateErrors = validate(data, createPipelineSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const staffId = res.locals.staffPayload.id;
      const pipeline = await PipelineModel.create({ ...data, ...{ staffId: staffId } }, { transaction });
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

  /**
   * @swagger
   * /customer/deal/get-pipelineStage/{pipelineId}:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getPipelineStageByPipelineId
   *     parameters:
   *     - in: path
   *       name: pipelineId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getPipelineStageByPipelineId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pipelineId = req.params.pipelineId;
      const validateErrors = validate(pipelineId, pipelineIdSchema);
      if(validateErrors){
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      };
      const pipelineStage = await PipelineStageModel.findAll({ where: { pipelineId: pipelineId }, order: ['order'] });
      if(!pipelineStage){
        return next(
          new CustomError(pipelineStageErrorDetails.E_3102(`pipelineId ${pipelineId} not found`), httpStatus.NOT_FOUND)
        );
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipelineStage));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   pipelineStageCreate:
   *       properties:
   *           pipelineId:
   *               type: string
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *           order:
   *               type: integer
   */
  /**
   * @swagger
   * /customer/deal/create-pipelineStage:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createPipelineStage
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/pipelineStageCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPipelineStage = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const data: any = {
        pipelineId: req.body.pipelineId,
        name: req.body.name,
        rottingIn: req.body.rottingIn,
        order: req.body.order
      };
      const validateErrors = validate(data, createPipelineStageSchema);
      if(validateErrors){
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const pipelineStage = await PipelineStageModel.create(data, { transaction });
      transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipelineStage));
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
   *   pipelineStageUpdate:
   *       properties:
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *           order:
   *               type: integer
   *
   */

  /**
   * @swagger
   * /customer/deal/update-pipelineStage/{pipelineStageId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updatePipelineStage
   *     parameters:
   *     - in: "path"
   *       name: "pipelineStageId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/pipelineStageUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updatePipelineStage = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const pipelineStageId = req.params.pipelineStageId;
      const data: any = {
        name: req.body.name,
        rottingIn: req.body.rottingIn,
        order: req.body.order
      };
      const validateErrors = validate(data, updatePipelineStageSchema);
      if(validateErrors){
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const pipelineStage = await PipelineStageModel.findOne({ where: { id: pipelineStageId } });
      if(!pipelineStage){
        throw new CustomError(pipelineStageErrorDetails.E_3102(`pipelineId ${pipelineStageId} not found`), httpStatus.NOT_FOUND);
      }
      await pipelineStage.update(data, { transaction });
      transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipelineStage));
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
   * /customer/deal/delete-pipelineStage/{pipelineStageId}:
   *   delete:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: deletePipelineStage
   *     parameters:
   *     - in: path
   *       name: pipelineStageId
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
  public deletePipelineStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pipelineStageId = req.params.pipelineStageId;
      const validateErrors = validate(pipelineStageId, pipelineStageIdSchema);
      if(validateErrors){
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const pipelineStage = await PipelineStageModel.findOne({ where: { id: pipelineStageId } });
      if(!pipelineStage){
        return next(
          new CustomError(pipelineStageErrorDetails.E_3102(`pipelineStageId ${pipelineStageId} not found`), httpStatus.NOT_FOUND)
        );
      }
      await PipelineStageModel.destroy({ where: { id: pipelineStageId } });
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   pipelineStageSetting:
   *       properties:
   *           id:
   *              type: string
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *           order:
   *               type: integer
   *
   */
  /**
   * @swagger
   * definitions:
   *   settingStage:
   *       required:
   *           name
   *           listPipelineStage
   *       properties:
   *           name:
   *               type: string
   *           listPipelineStage:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/pipelineStageSetting'
   */

  /**
   * @swagger
   * /customer/deal/setting-pipelineStage/{pipelineId}:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: settingPipelineStage
   *     parameters:
   *     - in: "path"
   *       name: "pipelineId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/settingStage'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public settingPipelineStage = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const validateErrors = validate(req.body, settingPipelineStageSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const pipeline = await PipelineModel.findOne({ where: { id: req.params.pipelineId } });
      if(!pipeline){
        throw new CustomError(pipelineErrorDetails.E_3101(`pipelineId ${req.params.pipelineId} not found`), httpStatus.NOT_FOUND);
      }
      await pipeline.update({ ... { name: req.body.name} }, { transaction });
      for(let i = 0; i < req.body.listPipelineStage.length; i++){
        const data = {
          name: req.body.listPipelineStage[i].name,
          rottingIn: req.body.listPipelineStage[i].rottingIn,
          order: req.body.listPipelineStage[i].order,
          pipelineId: req.params.pipelineId
        }
        if(!req.body.listPipelineStage[i].id){
          await PipelineStageModel.create(data, { transaction });
        }
        else{
          const pipelineStage = await PipelineStageModel.findOne({ where: { id: req.body.listPipelineStage[i].id } });
          if(!pipelineStage){
            throw new CustomError(pipelineStageErrorDetails.E_3102(`pipelineStageId ${req.body.listPipelineStage[i].id} not found`), httpStatus.NOT_FOUND);
          }
          await pipelineStage.update(data, { transaction });
        }
      }
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

}
