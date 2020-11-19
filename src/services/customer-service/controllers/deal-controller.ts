import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import {
  PipelineModel,
  PipelineStageModel,
  sequelize,
  DealModel,
  CompanyModel,
  CustomerWisereModel,
  StaffModel,
  AppointmentModel
} from '../../../repositories/postgres/models';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  pipelineIdSchema,
  pipelineStageIdSchema,
  settingPipelineStageSchema,
  filterDeal,
  createDealSchema,
  dealIdSchema,
  updateDealSchema,
  settingPipelineSchema,
  movePipelineStageIdSchema,
  statusDealSchema
} from '../configs/validate-schemas/deal';
import {
  dealErrorDetails,
  pipelineErrorDetails,
  pipelineStageErrorDetails,
  staffErrorDetails,
  customerErrorDetails
} from '../../../utils/response-messages/error-details';
import { FindOptions, Op } from 'sequelize';
import { paginate, paginateElasticSearch } from '../../../utils/paginator';
import { EAppointmentStatus, EOrder, EStatusPipelineStage } from '../../../utils/consts';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { SearchParams } from 'elasticsearch';
import { elasticsearchClient } from '../../../repositories/elasticsearch/connector';
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
      const pipelines = await PipelineModel.findAll({
        include: [
          {
            model: CompanyModel,
            as: 'company',
            required: true,
            where: { ownerId: staffId }
          }
        ]
      });
      return res.status(httpStatus.OK).send(buildSuccessMessage(pipelines));
    } catch (error) {
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
   *     - in: query
   *       name: movePipelineStageId
   *       type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public deletePipeline = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const pipelineId = req.params.pipelineId;
      const movePipelineStageId = req.query.movePipelineStageId;
      let validateErrors: any;
      validateErrors = validate(pipelineId, pipelineIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      validateErrors = validate(movePipelineStageId, movePipelineStageIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const checkPipeline = await PipelineModel.findOne({
        where: { id: pipelineId, companyId: res.locals.staffPayload.companyId }
      });
      if (!checkPipeline) {
        throw new CustomError(pipelineErrorDetails.E_3101(`pipelineId ${pipelineId} not found`), httpStatus.NOT_FOUND);
      }
      transaction = await sequelize.transaction();
      const pipelineStages = await PipelineStageModel.findAll({ where: { pipelineId: pipelineId } });
      if (movePipelineStageId) {
        const checkMovePipelineStage = await PipelineStageModel.findOne({
          where: { id: movePipelineStageId },
          include: [
            {
              model: PipelineModel,
              as: 'pipeline',
              where: { companyId: res.locals.staffPayload.companyId, id: { [Op.ne]: pipelineId } }
            }
          ]
        });
        if (!checkMovePipelineStage) {
          throw new CustomError(
            pipelineStageErrorDetails.E_3201(`movePipelineId ${movePipelineStageId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        for (let i = 0; i < pipelineStages.length; i++) {
          await DealModel.update(
            { pipelineStageId: movePipelineStageId },
            { where: { pipelineStageId: pipelineStages[i].id }, transaction }
          );
        }
      } else {
        for (let i = 0; i < pipelineStages.length; i++) {
          await DealModel.destroy({ where: { pipelineStageId: pipelineStages[i].id }, transaction });
        }
      }
      await PipelineStageModel.destroy({ where: { pipelineId: pipelineId }, transaction });
      await PipelineModel.destroy({ where: { id: pipelineId }, transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      // rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
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
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const listPipelineStage: any = await PipelineStageModel.findAll({
        where: { pipelineId: pipelineId },
        order: ['order']
      });
      if (!listPipelineStage) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3201(`pipelineId ${pipelineId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      for (let i = 0; i < listPipelineStage.length; i++) {
        let totalValueDeal = 0;
        let totalValueStage = 0;
        let probationReality = 0;
        const deal = await DealModel.findAll({ where: { pipelineStageId: listPipelineStage[i].id } });
        if (deal.length > 0) {
          let valueStage: number;
          for (let j = 0; j < deal.length; j++) {
            totalValueDeal += deal[j].amount;
            const pipeline: any = await PipelineModel.findOne({
              include: [
                {
                  model: PipelineStageModel,
                  as: 'pipelineStages',
                  required: true,
                  where: { id: listPipelineStage[i].id }
                }
              ]
            });
            if (pipeline.isActiveProbability) {
              if (deal[j].probability) {
                valueStage = (deal[j].amount * deal[j].probability) / 100;
              } else {
                valueStage = (deal[j].amount * pipeline.pipelineStages[0].probability) / 100;
              }
            } else {
              valueStage = (deal[j].amount * pipeline.pipelineStages[0].probability) / 100;
            }
            totalValueStage += valueStage;
          }
          probationReality = Math.round((totalValueStage / totalValueDeal) * 100);
        }
        listPipelineStage[i] = {
          ...listPipelineStage[i].dataValues,
          totalDeal: deal.length,
          totalValueDeal: totalValueDeal,
          totalValueStage: totalValueStage,
          probationReality: probationReality
        };
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(listPipelineStage));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   pipelineStageDelete:
   *       properties:
   *           oldPipelineStageId:
   *               type: string
   *           movePipelineStageId:
   *               type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   pipelineStageSetting:
   *       properties:
   *           id:
   *               type: string
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *           probability:
   *               type: number
   *               format: float
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
   *           isActiveProbability
   *           listPipelineStage
   *       properties:
   *           name:
   *               type: string
   *           isActiveProbability:
   *               type: boolean
   *           listPipelineStage:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/pipelineStageSetting'
   *           listDeletePipelineStage:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/pipelineStageDelete'
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
      const validateErrors = validate(req.body, settingPipelineStageSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const checkUniqName = _.uniqBy(req.body.listPipelineStage, 'name');
      if (req.body.listPipelineStage.length !== checkUniqName.length) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3202('pipeline stage name exists in pipeline'),
          httpStatus.BAD_REQUEST
        );
      }
      const pipeline = await PipelineModel.findOne({ where: { id: req.params.pipelineId } });
      if (!pipeline) {
        throw new CustomError(
          pipelineErrorDetails.E_3101(`pipelineId ${req.params.pipelineId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const checkPipeline = await PipelineModel.findOne({
        where: {
          id: { [Op.ne]: req.params.pipelineId },
          name: req.body.name,
          companyId: res.locals.staffPayload.companyId
        }
      });
      if (checkPipeline) {
        throw new CustomError(
          pipelineErrorDetails.E_3102(`name ${req.body.name} exists in company`),
          httpStatus.BAD_REQUEST
        );
      }
      transaction = await sequelize.transaction();
      await pipeline.update(
        { name: req.body.name, isActiveProbability: req.body.isActiveProbability },
        { transaction }
      );
      for (let i = 0; i < req.body.listPipelineStage.length; i++) {
        const data = {
          name: req.body.listPipelineStage[i].name,
          rottingIn: req.body.listPipelineStage[i].rottingIn,
          order: req.body.listPipelineStage[i].order,
          probability: req.body.listPipelineStage[i].probability,
          pipelineId: req.params.pipelineId
        };
        let checkPipelineStage: any;
        if (!req.body.listPipelineStage[i].id) {
          checkPipelineStage = await PipelineStageModel.findOne({
            where: { pipelineId: data.pipelineId, name: data.name }
          });
          if (checkPipelineStage) {
            throw new CustomError(
              pipelineStageErrorDetails.E_3202(
                `pipelineId ${data.pipelineId}, name ${data.name} exists in pipeline stage`
              ),
              httpStatus.BAD_REQUEST
            );
          }
          await PipelineStageModel.create(data, { transaction });
        } else {
          const pipelineStageId = req.body.listPipelineStage[i].id;
          const pipelineStage = await PipelineStageModel.findOne({ where: { id: pipelineStageId } });
          if (!pipelineStage) {
            throw new CustomError(
              pipelineStageErrorDetails.E_3201(`pipelineStageId ${pipelineStageId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          const conditionId = { [Op.ne]: pipelineStageId };
          checkPipelineStage = await PipelineStageModel.findOne({
            where: { id: conditionId, pipelineId: data.pipelineId, name: data.name }
          });
          if (checkPipelineStage) {
            throw new CustomError(
              pipelineStageErrorDetails.E_3202(
                `pipelineId ${data.pipelineId}, name ${data.name} exists in pipeline stage`
              ),
              httpStatus.BAD_REQUEST
            );
          }
          await pipelineStage.update(data, { transaction });
        }
      }
      if (req.body.listDeletePipelineStage) {
        for (let i = 0; i < req.body.listDeletePipelineStage.length; i++) {
          const checkOldPipelineStage = await PipelineStageModel.findOne({
            where: { id: req.body.listDeletePipelineStage[i].oldPipelineStageId }
          });
          if (!checkOldPipelineStage) {
            throw new CustomError(
              pipelineStageErrorDetails.E_3201(
                `pipelineStageId ${req.body.listDeletePipelineStage[i].oldPipelineStageId} not found`
              ),
              httpStatus.NOT_FOUND
            );
          }
          if (req.body.listDeletePipelineStage[i].movePipelineStageId) {
            const checkMovePipelineStage = await PipelineStageModel.findOne({
              where: { id: req.body.listDeletePipelineStage[i].movePipelineStageId }
            });
            if (!checkMovePipelineStage) {
              throw new CustomError(
                pipelineStageErrorDetails.E_3201(
                  `pipelineStageId ${req.body.listDeletePipelineStage[i].movePipelineStageId} not found`
                ),
                httpStatus.NOT_FOUND
              );
            }
            if (checkOldPipelineStage.pipelineId !== checkMovePipelineStage.pipelineId) {
              throw new CustomError(
                pipelineStageErrorDetails.E_3203(
                  `pipelineStageId ${req.body.listDeletePipelineStage[i].oldPipelineStageId} and  ${req.body.listDeletePipelineStage[i].movePipelineStageId} have different pipelineId`
                ),
                httpStatus.BAD_REQUEST
              );
            }
            await DealModel.update(
              { pipelineStageId: req.body.listDeletePipelineStage[i].movePipelineStageId },
              { where: { pipelineStageId: req.body.listDeletePipelineStage[i].oldPipelineStageId }, transaction }
            );
          } else {
            await DealModel.destroy({
              where: { pipelineStageId: req.body.listDeletePipelineStage[i].oldPipelineStageId },
              transaction
            });
          }
          await PipelineStageModel.destroy({
            where: { id: req.body.listDeletePipelineStage[i].oldPipelineStageId },
            transaction
          });
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

  /**
   * @swagger
   * /customer/deal/get-all-deal:
   *   get:
   *     summary: Get all deal
   *     description: Get all deal
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getAllDeal
   *     parameters:
   *       - in: query
   *         name: customerWisereId
   *         schema:
   *            type: string
   *       - in: query
   *         name: pipelineStageId
   *         schema:
   *            type: string
   *       - in: query
   *         name: pipelineId
   *         schema:
   *            type: string
   *       - in: query
   *         name: pageNum
   *         required: true
   *         schema:
   *            type: integer
   *       - in: query
   *         name: pageSize
   *         required: true
   *         schema:
   *            type: integer
   *       - in: query
   *         name: showStatus
   *         schema:
   *            type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getAllDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const conditions = {
        staffId: res.locals.staffPayload.id,
        customerWisereId: req.query.customerWisereId,
        pipelineStageId: req.query.pipelineStageId,
        pipelineId: req.query.pipelineId,
        showStatus: req.query.showStatus
      };
      let validateErrors: any;
      validateErrors = validate(conditions, filterDeal);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const query: FindOptions = {
        where: { createdBy: conditions.staffId },
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false
          },
          {
            model: StaffModel,
            as: 'owner',
            required: false
          },
          {
            model: AppointmentModel,
            as: 'appointment',
            required: false,
            attributes: ['id', 'status']
          }
        ]
      };

      if (conditions.customerWisereId) {
        query.where = {
          ...query.where,
          ...{ customerWisereId: { [Op.eq]: conditions.customerWisereId } }
        };
      }
      if (conditions.pipelineStageId) {
        query.where = {
          ...query.where,
          ...{ pipelineStageId: { [Op.eq]: conditions.pipelineStageId } }
        };
      }
      if (!conditions.showStatus) {
        query.where = {
          ...query.where,
          ...{ status: { [Op.eq]: EStatusPipelineStage.OPEN } }
        };
      }
      const conditionPipelineId = conditions.pipelineId
        ? {
            model: PipelineStageModel,
            as: 'pipelineStage',
            where: { pipelineId: conditions.pipelineId }
          }
        : {
            model: PipelineStageModel,
            as: 'pipelineStage'
          };
      query.include.push(conditionPipelineId);
      const deals = await paginate(
        DealModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      const currentDate = moment().format('YYYY/MM/DD');
      deals.data = deals.data.map((deal: any) => {
        let isExpired = false;
        if (
          new Date(currentDate) > new Date(deal.expectedCloseDate) ||
          (deal.appointment && deal.appointment.status === EAppointmentStatus.NO_SHOW)
        ) {
          isExpired = true;
        }
        deal = {
          isExpired: isExpired,
          ...deal.dataValues
        };
        return deal;
      });
      return res.status(httpStatus.OK).send(buildSuccessMessage(deals));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   dealCreate:
   *       properties:
   *           dealTitle:
   *               type: string
   *           ownerId:
   *               type: string
   *           amount:
   *               type: integer
   *           currency:
   *               type: string
   *           probability:
   *               type: number
   *               format: float
   *           source:
   *               type: string
   *           expectedCloseDate:
   *               type: string
   *           note:
   *               type: string
   *           pipelineStageId:
   *               type: string
   *           customerWisereId:
   *               type: string
   *
   */
  /**
   * @swagger
   * /customer/deal/create-deal:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: createDeal
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/dealCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createDealSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const data = {
        dealTitle: req.body.dealTitle,
        ownerId: req.body.ownerId,
        amount: req.body.amount,
        currency: req.body.currency,
        probability: req.body.probability,
        source: req.body.source,
        expectedCloseDate: req.body.expectedCloseDate,
        note: req.body.note,
        pipelineStageId: req.body.pipelineStageId,
        customerWisereId: req.body.customerWisereId,
        createdBy: res.locals.staffPayload.id
      };
      if (data.ownerId) {
        const checkOwnerId = await StaffModel.findOne({ where: { id: data.ownerId } });
        if (!checkOwnerId) {
          throw new CustomError(staffErrorDetails.E_4000(`ownerId ${data.ownerId} not found`), httpStatus.NOT_FOUND);
        }
      }
      const checkPipelineStageId = await PipelineStageModel.findOne({ where: { id: data.pipelineStageId } });
      if (!checkPipelineStageId) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3201(`pipelineStageId ${data.pipelineStageId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const checkCustomerWisereId = await CustomerWisereModel.findOne({ where: { id: data.customerWisereId } });
      if (!checkCustomerWisereId) {
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${data.customerWisereId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const deal = await DealModel.create(data);
      return res.status(httpStatus.OK).send(buildSuccessMessage(deal));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/deal/get-deal/{dealId}:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: getDealById
   *     parameters:
   *     - in: path
   *       name: dealId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public getDealById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dealId = req.params.dealId;
      const validateErrors = validate(dealId, dealIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let deal: any = await DealModel.findOne({
        where: { id: dealId },
        include: [
          {
            model: CustomerWisereModel,
            as: 'customerWisere'
          },
          {
            model: PipelineStageModel,
            as: 'pipelineStage',
            include: [
              {
                model: PipelineModel,
                as: 'pipeline'
              }
            ]
          },
          {
            model: StaffModel,
            as: 'owner',
            required: false
          },
          {
            model: AppointmentModel,
            as: 'appointment',
            required: false,
            attributes: ['id', 'status']
          }
        ]
      });
      if (!deal) {
        throw new CustomError(dealErrorDetails.E_3301(`dealId ${dealId} not found`), httpStatus.NOT_FOUND);
      }
      const currentDate = moment().format('YYYY/MM/DD');
      let isExpired = false;
      if (
        new Date(currentDate) > new Date(deal.expectedCloseDate) ||
        (deal.appointment && deal.appointment.status === EAppointmentStatus.NO_SHOW)
      ) {
        isExpired = true;
      }
      deal = {
        isExpired: isExpired,
        ...deal.dataValues
      };
      return res.status(httpStatus.OK).send(buildSuccessMessage(deal));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   dealUpdate:
   *       properties:
   *           dealTitle:
   *               type: string
   *           ownerId:
   *               type: string
   *           amount:
   *               type: integer
   *           currency:
   *               type: string
   *           probability:
   *               type: number
   *               format: float
   *           source:
   *               type: string
   *           expectedCloseDate:
   *               type: string
   *           note:
   *               type: string
   *           pipelineStageId:
   *               type: string
   *           customerWisereId:
   *               type: string
   *           status:
   *               type: string
   *
   */

  /**
   * @swagger
   * /customer/deal/update-deal/{dealId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updateDeal
   *     parameters:
   *     - in: "path"
   *       name: "dealId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/dealUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateDeal = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dealId = req.params.dealId;
      const data: any = {
        dealTitle: req.body.dealTitle,
        ownerId: req.body.ownerId,
        amount: req.body.amount,
        currency: req.body.currency,
        probability: req.body.probability,
        source: req.body.source,
        expectedCloseDate: req.body.expectedCloseDate,
        note: req.body.note,
        pipelineStageId: req.body.pipelineStageId,
        customerWisereId: req.body.customerWisereId,
        status: req.body.status
      };
      const validateErrors = validate(data, updateDealSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let deal = await DealModel.findOne({ where: { id: dealId } });
      if (!deal) {
        throw new CustomError(dealErrorDetails.E_3301(`dealId ${dealId} not found`), httpStatus.NOT_FOUND);
      }
      const pipelineStage = await PipelineStageModel.findOne({ where: { id: data.pipelineStageId } });
      if (!pipelineStage) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3201(`pipeline stage ${data.pipelineStageId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      if (data.customerWisereId) {
        const customerWisere = await CustomerWisereModel.findOne({ where: { id: data.customerWisereId } });
        if (!customerWisere) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${data.customerWisereId} not found`),
            httpStatus.NOT_FOUND
          );
        }
      }
      if (deal.appointmentId) {
        if (
          (deal.status === EStatusPipelineStage.WON || deal.status === EStatusPipelineStage.LOST) &&
          data.status === EStatusPipelineStage.OPEN
        ) {
          throw new CustomError(dealErrorDetails.E_3303(`can not reopen deal ${dealId} `), httpStatus.BAD_REQUEST);
        }
      }
      let closingDate: any;
      if (data.status === EStatusPipelineStage.WON || data.status === EStatusPipelineStage.LOST) {
        closingDate = Date.now();
      } else {
        closingDate = null;
      }
      data.closingDate = closingDate;
      transaction = await sequelize.transaction();
      if (deal.appointmentId) {
        let changeStatus: string;
        if (pipelineStage.order === 1) {
          changeStatus = EAppointmentStatus.NEW;
        } else if (pipelineStage.order === 3) {
          changeStatus = EAppointmentStatus.CONFIRMED;
        }
        if (data.status === EStatusPipelineStage.LOST) {
          const appointment = await AppointmentModel.findOne({ where: { id: deal.appointmentId } });
          if (appointment) {
            if (appointment.status !== EAppointmentStatus.IN_SERVICE) {
              changeStatus = EAppointmentStatus.CANCEL;
            }
          }
        }
        await AppointmentModel.update({ status: changeStatus }, { where: { id: deal.appointmentId }, transaction });
      }
      deal = await deal.update(data, transaction);
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(deal));
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
   * /customer/deal/delete-deal/{dealId}:
   *   delete:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: deleteDeal
   *     parameters:
   *     - in: path
   *       name: dealId
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
  public deleteDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dealId = req.params.dealId;
      const validateErrors = validate(dealId, dealIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const deal = await DealModel.findOne({ where: { id: dealId } });
      if (!deal) {
        throw new CustomError(dealErrorDetails.E_3301(`dealId ${dealId} not found`), httpStatus.NOT_FOUND);
      }
      await DealModel.destroy({ where: { id: dealId } });
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/deal/update-pipeline-stage-of-deal/{dealId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updatePipelineStageOfDeal
   *     parameters:
   *     - in: "path"
   *       name: "dealId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         properties:
   *           newPipelineStageId:
   *               type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updatePipelineStageOfDeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dealId = req.params.dealId;
      const newPipelineStageId = req.body.newPipelineStageId;
      const validateErrors = validate(newPipelineStageId, pipelineStageIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let deal: any = await DealModel.findOne({
        where: { id: dealId },
        include: [
          {
            model: PipelineStageModel,
            as: 'pipelineStage'
          }
        ]
      });
      if (!deal) {
        throw new CustomError(dealErrorDetails.E_3301(`dealId ${dealId} not found`), httpStatus.NOT_FOUND);
      }
      const checkNewPipelineStage = await PipelineStageModel.findOne({ where: { id: newPipelineStageId } });
      if (!checkNewPipelineStage) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3201(`newPipelineStageId ${newPipelineStageId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      if (deal.pipelineStage.pipelineId !== checkNewPipelineStage.pipelineId) {
        throw new CustomError(
          dealErrorDetails.E_3302(
            `newPipelineStageId ${newPipelineStageId} and oldPipelineStageId ${deal.pipelineStage.pipelineId} not same pipeline`
          ),
          httpStatus.BAD_REQUEST
        );
      }
      deal = await deal.update({ pipelineStageId: newPipelineStageId });
      return res.status(httpStatus.OK).send(buildSuccessMessage(deal));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   stageSetting:
   *       properties:
   *           name:
   *               type: string
   *           rottingIn:
   *               type: integer
   *           probability:
   *               type: number
   *               format: float
   *           order:
   *               type: integer
   *
   */
  /**
   * @swagger
   * definitions:
   *   settingPipeline:
   *       required:
   *           name
   *           isActiveProbability
   *           listPipelineStage
   *       properties:
   *           name:
   *               type: string
   *           isActiveProbability:
   *               type: boolean
   *           listPipelineStage:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/stageSetting'
   */

  /**
   * @swagger
   * /customer/deal/setting-pipeline:
   *   post:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: settingPipeline
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/settingPipeline'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public settingPipeline = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, settingPipelineSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const checkUniqName = _.uniqBy(req.body.listPipelineStage, 'name');
      if (req.body.listPipelineStage.length !== checkUniqName.length) {
        throw new CustomError(
          pipelineStageErrorDetails.E_3202('duplicate pipeline stage name'),
          httpStatus.BAD_REQUEST
        );
      }
      const dataPipeline = {
        id: uuidv4(),
        name: req.body.name,
        isActiveProbability: req.body.isActiveProbability,
        companyId: res.locals.staffPayload.companyId
      };
      const checkPipeline = await PipelineModel.findOne({
        where: { name: dataPipeline.name, companyId: dataPipeline.companyId }
      });
      if (checkPipeline) {
        throw new CustomError(
          pipelineErrorDetails.E_3102(`name ${req.body.name} exists in company`),
          httpStatus.BAD_REQUEST
        );
      }
      transaction = await sequelize.transaction();
      await PipelineModel.create(dataPipeline, { transaction });
      for (let i = 0; i < req.body.listPipelineStage.length; i++) {
        req.body.listPipelineStage[i].pipelineId = dataPipeline.id;
      }
      await PipelineStageModel.bulkCreate(req.body.listPipelineStage, { transaction });
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

  /**
   * @swagger
   * /customer/deal/update-status-deal/{dealId}:
   *   put:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: updateStatusDeal
   *     parameters:
   *     - in: "path"
   *       name: "dealId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         properties:
   *             status:
   *                 type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateStatusDeal = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dealId = req.params.dealId;
      const status = req.body.status;
      const validateErrors = validate(status, statusDealSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let deal = await DealModel.findOne({ where: { id: dealId } });
      if (!deal) {
        throw new CustomError(dealErrorDetails.E_3301(`dealId ${dealId} not found`), httpStatus.NOT_FOUND);
      }
      if (deal.appointmentId) {
        if (
          (deal.status === EStatusPipelineStage.WON || deal.status === EStatusPipelineStage.LOST) &&
          status === EStatusPipelineStage.OPEN
        ) {
          throw new CustomError(dealErrorDetails.E_3303(`can not reopen deal ${dealId} `), httpStatus.BAD_REQUEST);
        }
      }
      let closingDate: any;
      if (status === EStatusPipelineStage.WON || status === EStatusPipelineStage.LOST) {
        closingDate = Date.now();
      } else {
        closingDate = null;
      }
      transaction = await sequelize.transaction();
      if (deal.appointmentId) {
        if (status === EStatusPipelineStage.LOST) {
          const appointment = await AppointmentModel.findOne({ where: { id: deal.appointmentId } });
          if (appointment) {
            if (appointment.status !== EAppointmentStatus.IN_SERVICE) {
              await appointment.update({ status: EAppointmentStatus.CANCEL }, { transaction });
            }
          }
        }
      }
      deal = await deal.update({ status: status, closingDate: closingDate }, { transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(deal));
    } catch (error) {
      // rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * /customer/deal/search-deal:
   *   get:
   *     tags:
   *       - Customer
   *     security:
   *       - Bearer: []
   *     name: searchDeals
   *     parameters:
   *     - in: query
   *       name: keyWords
   *       schema:
   *          type: string
   *     - in: query
   *       name: pageNum
   *       schema:
   *          type: integer
   *       required: true
   *     - in: query
   *       name: pageSize
   *       schema:
   *          type: integer
   *       required: true
   *     - in: query
   *       name: order
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public searchDeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions: any = {
        pageNum: +req.query.pageNum,
        pageSize: +req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const keywords = req.query.keyWords;
      const searchParams: SearchParams = {
        index: 'get_deals_dev',
        body: {
          query: {
            bool: {
              must: [
                !keywords
                  ? {
                      match_all: {}
                    }
                  : {
                      query_string: {
                        fields: [
                          'dealTitle',
                          'customerWisere.firstName',
                          'owner.firstName',
                          'appointment.status',
                          'pipeline_stage.name'
                        ],
                        query: `${(req.query.keyWords as string).replace(/  +/g, ' ').trim()}`
                      }
                    }
              ]
            }
          }
        }
      };
      if (req.body.order === EOrder.NEWEST) {
        searchParams.body.sort = [{ createdAt: 'desc' }];
      }
      const deals = await paginateElasticSearch(elasticsearchClient, searchParams, paginateOptions, fullPath);
      return res.status(httpStatus.OK).send(buildSuccessMessage(deals));
    } catch (error) {
      return next(error);
    }
  };
}
