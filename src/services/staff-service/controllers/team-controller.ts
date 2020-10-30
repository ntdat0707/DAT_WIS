import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op, Sequelize } from 'sequelize';
require('dotenv').config();
import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { paginate } from '../../../utils/paginator';
import {
  LocationModel,
  sequelize,
  TeamLocationModel,
  TeamModel,
  TeamStaffModel,
  TeamSubModel
} from '../../../repositories/postgres/models';

import { locationIdSchema } from '../../../services/branch-service/configs/validate-schemas';
import { createTeamSchema } from '../configs/validate-schemas/team';
import { teamErrorDetails, teamSubErrorDetails } from '../../../utils/response-messages/error-details/team';

export class TeamController {
  /**
   * @swagger
   * /staff/team/get-teams-location/{locationId}:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getTeamsLocation
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
   *     - in: query
   *       name: searchValue
   *       required: false
   *       schema:
   *          type: string
   *     - in: path
   *       name: locationId
   *       required: true
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
  public getTeamsLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(req.params.locationId, locationIdSchema);
      const validatePaginationErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validatePaginationErrors || validateErrors)
        return next(new CustomError(validatePaginationErrors, HttpStatus.BAD_REQUEST));
      const query: FindOptions = {
        include: [
          {
            model: LocationModel,
            as: 'locations',
            through: { attributes: [] },
            where: { id: req.params.locationId }
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      };

      if (req.query.searchValue) {
        query.where = {
          ...query.where,
          ...{
            [Op.or]: [Sequelize.literal(`unaccent("TeamModel"."name") ilike unaccent('%${req.query.searchValue}%')`)]
          }
        };
      }
      const teamStaffs = await paginate(
        TeamModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(teamStaffs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   listMembers:
   *       properties:
   *           staffId:
   *               type: string
   *               required: true
   *           position:
   *               type: string
   *
   */

  /**
   * @swagger
   * /staff/team/create-team:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: createTeam
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *     - in: "formData"
   *       name: "name"
   *       required: true
   *       type: string
   *     - in: "formData"
   *       name: locationIds
   *       type: array
   *       items:
   *           type: string
   *       required: true
   *     - in: "formData"
   *       name: "description"
   *       type: string
   *     - in: "formData"
   *       name: members
   *       type: array
   *       items:
   *           $ref: '#/definitions/listMembers'
   *     - in: "formData"
   *       name: "subTeamIds"
   *       type: array
   *       items:
   *           type: string
   *     - in: "formData"
   *       name: "parentId"
   *       type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public createTeam = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, createTeamSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      transaction = await sequelize.transaction();
      if (req.body.subTeamIds) {
        const dataTeamSubs: any = [];
        for (const subTeamId of req.body.subTeamIds) {
          const teamSub = await TeamModel.findOne({
            where: { id: subTeamId }
          });
          if (!teamSub) {
            return next(new CustomError(teamErrorDetails.E_5001(`This team ${subTeamId} does not exist`)));
          }
          if (teamSub.parentId) {
            return next(new CustomError(teamSubErrorDetails.E_5200(`This team ${subTeamId} already has parent`)));
          }
          dataTeamSubs.push(teamSub);
        }
        await TeamSubModel.bulkCreate(dataTeamSubs, { transaction });
      }
      let dataTeam: any = {
        name: req.body.name,
        parentId: req.body.parentId
      };
      if (req.file) {
        const dataImage = {
          path: (req.file as any).location,
          isAvatar: true
        };
        dataTeam = { ...dataTeam, photo: dataImage.path };
      }
      const team = await TeamModel.create(dataTeam);
      const dataTeamLocations: any = [];
      const dataTeamStaffs: any = [];
      for (const locationId of req.body.locationIds) {
        const teamLocation = {
          locationId: locationId,
          teamId: team.id
        };
        dataTeamLocations.push(teamLocation);
      }
      await TeamLocationModel.bulkCreate(dataTeamLocations, { transaction });
      for (let member of req.body.members) {
        member = { ...member, teamId: team.id };
        dataTeamStaffs.push(member);
      }
      await TeamStaffModel.bulkCreate(dataTeamStaffs, { transaction });

      await transaction.commit();
      return res.status(HttpStatus.OK).send();
      //buildSuccessMessage(teamStaffs));
    } catch (error) {
      return next(error);
    }
  };
}
