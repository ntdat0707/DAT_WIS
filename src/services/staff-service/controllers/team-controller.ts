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
  StaffModel,
  TeamLocationModel,
  TeamModel,
  TeamStaffModel,
  TeamSubModel
} from '../../../repositories/postgres/models';

import { locationIdSchema } from '../../../services/branch-service/configs/validate-schemas';
import { createTeamSchema, parentIdSchema, teamIdSchema, updateTeamSchema } from '../configs/validate-schemas/team';
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
          },
          {
            model: StaffModel,
            as: 'staffs',
            through: { attributes: [] },
            required: true,
            attributes: ['id', 'avatarPath']
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
   * /staff/team/get-sub-teams/{parentId}:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getSubTeams
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
   *       name: parentId
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
  public getSubTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(req.params.parentId, parentIdSchema);
      const validatePaginationErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validatePaginationErrors || validateErrors)
        return next(new CustomError(validatePaginationErrors, HttpStatus.BAD_REQUEST));
      const subTeamIds: any = (
        await TeamSubModel.findAll({
          where: {
            teamId: req.params.parentId
          }
        })
      ).map((subTeamId: any) => subTeamId.teamSubId);
      const query: FindOptions = {
        where: {
          id: { [Op.in]: subTeamIds }
        },
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
      const teamSubs = await paginate(
        TeamModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(teamSubs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/team/get-teams/{parentId}:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getSubTeams
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
   *       name: parentId
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
  public getTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(req.params.parentId, parentIdSchema);
      const validatePaginationErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validatePaginationErrors || validateErrors)
        return next(new CustomError(validatePaginationErrors, HttpStatus.BAD_REQUEST));
      const subTeamIds: any = (
        await TeamSubModel.findAll({
          where: {
            teamId: req.params.parentId
          }
        })
      ).map((subTeamId: any) => subTeamId.teamSubId);
      const query: FindOptions = {
        where: {
          id: { [Op.in]: subTeamIds }
        },
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
      const teamSubs = await paginate(
        TeamModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(HttpStatus.OK).send(buildSuccessMessage(teamSubs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/team/get-teams/{teamId}:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getTeam
   *     parameters:
   *     - in: path
   *       name: teamId
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
  public getTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.teamId, teamIdSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      let team: any = await TeamModel.findOne({
        where: {
          id: req.params.teamId
        },
        include: [
          {
            model: LocationModel,
            as: 'locations',
            through: { attributes: [] },
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: StaffModel,
            as: 'staffs',
            through: { attributes: [] },
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: TeamSubModel,
            as: 'teamSubs',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: TeamModel,
                as: 'teamParent',
                required: true,
                attributes: ['id', 'photo']
              }
            ]
          }
        ]
      });
      if (!team) {
        return next(new CustomError(teamErrorDetails.E_5001(`This team ${req.params.teamId} does not exist`)));
      }
      const teamParent = await TeamModel.findOne({
        where: { id: team.parentId },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });
      team = {
        ...team,
        teamParent: teamParent
      };
      return res.status(HttpStatus.OK).send(buildSuccessMessage(team));
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
      if (req.body.subTeamIds) {
        const dataTeamSubs: any = [];
        for (const subTeamId of req.body.subTeamIds) {
          const teamSub: any = await TeamModel.findOne({
            where: { id: subTeamId }
          });
          if (!teamSub) {
            throw next(new CustomError(teamErrorDetails.E_5001(`This team ${subTeamId} does not exist`)));
          }
          if (teamSub.parentId) {
            throw next(new CustomError(teamSubErrorDetails.E_5200(`This team ${subTeamId} already has parent`)));
          }
          const teamSubData: any = {
            teamId: team.id,
            teamSubId: teamSub.id
          };
          dataTeamSubs.push(teamSubData);
        }
        await TeamSubModel.bulkCreate(dataTeamSubs, { transaction });
      }
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
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   listMembers:
   *       properties:
   *           id:
   *               type: string
   *           oldStaffId:
   *               type: string
   *           newStaffId:
   *               type: string
   *           position:
   *               type: string
   *
   */

  /**
   * @swagger
   * definitions:
   *   listTeamLocationUpdate:
   *       properties:
   *           id:
   *               type: string
   *           oldLocationId:
   *               type: string
   *           newLocationId:
   *               type: string
   *
   */

  /**
   * @swagger
   * definitions:
   *   listSubTeam:
   *       properties:
   *           id:
   *               type: string
   *           oldSubTeamId:
   *               type: string
   *           newSubTeamId:
   *               type: string
   *
   */

  /**
   * @swagger
   * /staff/team/update-team/{teamId}:
   *   put:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: updateTeam
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: path
   *       name: teamId
   *       type: string
   *       required: true
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *     - in: "formData"
   *       name: "name"
   *       type: string
   *     - in: "formData"
   *       name: locationIdsUpdate
   *       type: array
   *       items:
   *           $ref: '#/definitions/listTeamLocationUpdate'
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
   *           $ref: '#/definitions/listSubTeam'
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
  public updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const dataInput = { ...req.body, teamId: req.params.teamId };
      const validateErrors = validate(dataInput, updateTeamSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      transaction = await sequelize.transaction();
      await this.UpdateTeamStaff(dataInput, transaction);
      if (dataInput.subTeamIds) {
        for (const subTeam of dataInput.subTeamIds) {
          if (subTeam.newSubTeamId) {
            const teamSub = await TeamModel.findOne({
              where: { id: subTeam.newSubTeamId }
            });
            if (!teamSub) {
              throw next(new CustomError(teamErrorDetails.E_5001(`This team ${subTeam.newSubTeamId} does not exist`)));
            }
            if (teamSub.parentId) {
              throw next(
                new CustomError(teamSubErrorDetails.E_5200(`This team ${subTeam.newSubTeamId} already has parent`))
              );
            }
          }
        }
      }
      await this.UpdateTeamSub(dataInput, transaction);
      let dataTeam: any = {
        name: dataInput.name,
        parentId: dataInput.parentId
      };
      if (req.file) {
        const dataImage = {
          path: (req.file as any).location,
          isAvatar: true
        };
        dataTeam = { ...dataTeam, photo: dataImage.path };
      }
      await TeamModel.update(dataTeam, { where: { id: dataInput.teamId } });
      await this.UpdateTeamLocation(dataInput, transaction);
      await this.UpdateTeamStaff(dataInput, transaction);
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  private async UpdateTeamLocation(dataInput: any, transaction: any) {
    for (const locationId of dataInput.locationIdsUpdate) {
      if (!locationId.newLocationId) {
        await TeamLocationModel.destroy({ where: { id: locationId.id }, transaction });
      }
      if (!locationId.oldLocationId && !locationId.id) {
        const teamLocationData = {
          teamId: dataInput.teamId,
          locationId: locationId.newLocationId
        };
        await TeamLocationModel.create(teamLocationData, { transaction });
      } else {
        await TeamLocationModel.update(
          { locationId: locationId.newLocationId },
          { where: { id: locationId.id }, transaction }
        );
      }
    }
  }

  private async UpdateTeamStaff(dataInput: any, transaction: any) {
    for (const member of dataInput.members) {
      if (!member.newStaffId) {
        await TeamStaffModel.destroy({ where: { id: member.id }, transaction });
      }
      if (!member.oldStaffId && !member.id) {
        const teamStaffData = {
          teamId: dataInput.teamId,
          staffId: member.newStaffId,
          position: member.position
        };
        await TeamStaffModel.create(teamStaffData, { transaction });
      } else {
        const teamStaffData = {
          teamId: dataInput.teamId,
          staffId: member.newStaffId,
          position: member.position
        };
        await TeamStaffModel.update(teamStaffData, { where: { id: member.id }, transaction });
      }
    }
  }
  private async UpdateTeamSub(dataInput: any, transaction: any) {
    for (const subTeam of dataInput.subTeamIds) {
      if (!subTeam.newSubTeamId) {
        await TeamSubModel.destroy({ where: { id: subTeam.id }, transaction });
      }
      if (!subTeam.oldSubTeamId && !subTeam.id) {
        const teamSubData = {
          teamId: subTeam.teamId,
          subTeamId: subTeam.newSubTeamId
        };
        await TeamSubModel.create(teamSubData, { transaction });
      } else {
        await TeamSubModel.update({ teamSubId: subTeam.newSubTeamId }, { where: { id: subTeam.id }, transaction });
      }
    }
  }
}
