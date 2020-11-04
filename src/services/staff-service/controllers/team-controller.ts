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
import { branchErrorDetails } from '../../../utils/response-messages/error-details/branch';
import _ from 'lodash';

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
      if (validatePaginationErrors) {
        return next(new CustomError(validatePaginationErrors, HttpStatus.BAD_REQUEST));
      }
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      if (!res.locals.staffPayload.workingLocationIds.includes(req.params.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
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
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['updatedAt', 'deletedAt'] }
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
      if (validatePaginationErrors) {
        return next(new CustomError(validatePaginationErrors, HttpStatus.BAD_REQUEST));
      }
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
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
   * /staff/team/get-team/{teamId}:
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
      let subTeams: any = [];
      let parentTeam: any = {};
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
          }
        ]
      });
      if (!team) {
        return next(new CustomError(teamErrorDetails.E_5001(`This team ${req.params.teamId} does not exist`)));
      }
      team = team.dataValues;
      const subs: any = await TeamSubModel.findAll({
        where: { teamId: team.id },
        include: [
          {
            model: TeamModel,
            as: 'teamDetail',
            required: true,
            attributes: ['id', 'photo']
          }
        ]
      });
      if (subs) {
        subTeams = subs.map((sub: any) => ({
          ...sub.dataValues
        }));
      }
      if (team.parentId) {
        const parent: any = await TeamModel.findOne({
          where: { id: team.parentId },
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        });
        if (parent) {
          parentTeam = parent.dataValues;
        }
      }
      team = { ...team, subTeams, parentTeam };
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
          path: (req.file as any).location
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
      const diffLocationId = _.difference(req.body.locationIds as string[], res.locals.staffPayload.workingLocationIds);
      if (diffLocationId.length) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${diffLocationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
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
   *           staffId:
   *               type: string
   *           position:
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
   *            $ref: '#/definitions/listMembers'
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
  public updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      let dataInput: any = { ...req.body, teamId: req.params.teamId };
      const validateErrors = validate(dataInput, updateTeamSchema);
      if (validateErrors) return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      transaction = await sequelize.transaction();
      if (dataInput.members && dataInput.members.length > 0) {
        await this.UpdateTeamStaff(dataInput, transaction);
      }
      if (dataInput.locationIds && dataInput.locationIds > 0) {
        for (const locationId of dataInput.locationIds) {
          if (!res.locals.staffPayload.workingLocationIds.includes(locationId)) {
            return next(
              new CustomError(
                branchErrorDetails.E_1001(`You can not access to location ${locationId}`),
                HttpStatus.FORBIDDEN
              )
            );
          }
        }
        await this.UpdateTeamLocation(dataInput, transaction);
      }
      if (dataInput.subTeamIds && dataInput.subTeamIds.length > 0) {
        for (const subTeamId of dataInput.subTeamIds) {
          const teamSub = await TeamModel.findOne({
            where: { id: subTeamId }
          });
          if (!teamSub) {
            throw next(new CustomError(teamErrorDetails.E_5001(`This team ${subTeamId} does not exist`)));
          }
          if (teamSub.parentId) {
            throw next(new CustomError(teamSubErrorDetails.E_5200(`This team ${subTeamId} already has parent`)));
          }
        }
        await this.UpdateTeamSub(dataInput, transaction);
      }
      if (req.file) {
        const dataImage = {
          path: (req.file as any).location
        };
        dataInput = { ...dataInput, photo: dataImage.path };
      }
      await TeamModel.update(dataInput, { where: { id: dataInput.teamId } });
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
    const currentTeamLocations = (
      await TeamLocationModel.findAll({
        where: { teamId: dataInput.teamId }
      })
    ).map((teamLocation: any) => teamLocation.locationId);
    const removeTeamLocations = _.difference(currentTeamLocations, dataInput.locationIds);
    if (removeTeamLocations.length > 0) {
      await TeamLocationModel.destroy({
        where: { teamId: dataInput.teamId, locationId: removeTeamLocations },
        transaction
      });
    }
    const addTeamLocations = _.difference(dataInput.locationIds, currentTeamLocations);
    if (addTeamLocations.length > 0) {
      const teamLocations = (addTeamLocations as []).map((locationId: string) => ({
        teamId: dataInput.teamId,
        locationId: locationId
      }));
      await TeamLocationModel.bulkCreate(teamLocations, { transaction });
    }
  }

  private async UpdateTeamStaff(dataInput: any, transaction: any) {
    const staffIdsInput: any = [];
    for (const member of dataInput.members) {
      staffIdsInput.push(member.staffId);
    }

    const currentTeamStaffs = (
      await TeamStaffModel.findAll({
        where: { teamId: dataInput.teamId }
      })
    ).map((teamStaff: any) => teamStaff.staffId);

    const removeTeamStaffs = _.difference(currentTeamStaffs, staffIdsInput);
    if (removeTeamStaffs.length > 0) {
      await TeamStaffModel.destroy({
        where: { teamId: dataInput.teamId, staffId: removeTeamStaffs },
        transaction
      });
    }
    const addTeamStaffs = _.difference(staffIdsInput, currentTeamStaffs);
    if (addTeamStaffs.length > 0) {
      const teamStaffsData: any = [];
      for (const teamStaffId of addTeamStaffs) {
        for (const staff of dataInput.members) {
          if (staff.staffId === teamStaffId) {
            const teamStaff = {
              teamId: dataInput.teamId,
              teamSubId: teamStaffId
            };
            teamStaffsData.push(teamStaff);
          }
        }
      }
      await TeamStaffModel.bulkCreate(teamStaffsData, { transaction });
    }
  }

  private async UpdateTeamSub(dataInput: any, transaction: any) {
    const currentTeamSubs = (
      await TeamSubModel.findAll({
        where: { teamId: dataInput.teamId }
      })
    ).map((teamSub: any) => teamSub.teamSubId);
    const removeTeamSubs = _.difference(currentTeamSubs, dataInput.subTeamIds);
    if (removeTeamSubs.length > 0) {
      await TeamSubModel.destroy({
        where: { teamId: dataInput.teamId, teamSubId: removeTeamSubs },
        transaction
      });
    }
    const addTeamSubs = _.difference(dataInput.subTeamIds, currentTeamSubs);

    if (addTeamSubs.length > 0) {
      const teamSubs = (addTeamSubs as []).map((teamSubId: string) => ({
        teamId: dataInput.teamId,
        teamSubId: teamSubId
      }));
      await TeamSubModel.bulkCreate(teamSubs, { transaction });
    }
  }
}
