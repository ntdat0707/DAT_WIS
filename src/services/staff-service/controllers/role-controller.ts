import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ERoleDefault } from '../../../utils/consts';
import { RoleModel, StaffModel } from '../../../repositories/postgres/models';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { roleErrorDetails } from '../../../utils/response-messages/error-details';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createRoleSchema, updateRoleSchema, roleIdSchema } from '../configs/validate-schemas';
import { FindOptions, Op } from 'sequelize';
import { paginate } from '../../../utils/paginator';

export class RoleController {
  /**
   * @swagger
   * definitions:
   *   roleCreate:
   *       required:
   *           roleName
   *       properties:
   *           roleName:
   *               type: string
   *           description:
   *               type: string
   */
  /**
   * @swagger
   * /staff/role/create-role:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: createRole
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/roleCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        roleName: req.body.roleName,
        description: req.body.description
      };
      const validateErrors = validate(data, createRoleSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const checkExistName = await RoleModel.findOne({ where: { roleName: data.roleName } });
      if (checkExistName) {
        throw new CustomError(
          roleErrorDetails.E_3800(`role name ${data.roleName} has been existed in system`),
          httpStatus.BAD_REQUEST
        );
      }
      const role = await RoleModel.create(data);
      return res.status(httpStatus.OK).send(buildSuccessMessage(role));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   roleUpdate:
   *       required:
   *           roleName
   *       properties:
   *           roleName:
   *               type: string
   *           description:
   *               type: string
   */
  /**
   * @swagger
   * /staff/role/update-role/{roleId}:
   *   post:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: updateRole
   *     parameters:
   *     - in: "path"
   *       name: "roleId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/roleUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId;
      const data = {
        roleName: req.body.roleName,
        description: req.body.description
      };
      const validateErrors = validate(data, updateRoleSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let role: any = await RoleModel.findOne({ where: { id: roleId } });
      if (!role) {
        throw new CustomError(roleErrorDetails.E_3801(`roleId ${roleId} not found`), httpStatus.NOT_FOUND);
      }
      if (Object.values(ERoleDefault).includes(role.roleName) && data.roleName !== role.roleName) {
        throw new CustomError(
          roleErrorDetails.E_3802(`role name ${data.roleName} can not edit`),
          httpStatus.BAD_REQUEST
        );
      }
      const checkExistName = await RoleModel.findOne({ where: { id: { [Op.ne]: roleId }, roleName: data.roleName } });
      if (checkExistName) {
        throw new CustomError(
          roleErrorDetails.E_3800(`role name ${data.roleName} has been existed in system`),
          httpStatus.BAD_REQUEST
        );
      }
      role = await role.update(data);
      return res.status(httpStatus.OK).send(buildSuccessMessage(role));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/role/delete-role/{roleId}:
   *   delete:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: deleteRole
   *     parameters:
   *     - in: "path"
   *       name: "roleId"
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId;
      const validateErrors = validate(roleId, roleIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const role: any = await RoleModel.findOne({
        where: { id: roleId },
        include: [
          {
            model: StaffModel,
            as: 'staffs',
            required: false
          }
        ]
      });
      if (!role) {
        throw new CustomError(roleErrorDetails.E_3801(`roleId ${roleId} not found`), httpStatus.NOT_FOUND);
      }
      if (Object.values(ERoleDefault).includes(role.roleName) || role.staffs.length > 0) {
        throw new CustomError(roleErrorDetails.E_3803(`can not delete roleId ${roleId}`), httpStatus.BAD_REQUEST);
      }
      await RoleModel.destroy({ where: { id: roleId } });
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /staff/role/get-all-role:
   *   get:
   *     tags:
   *       - Staff
   *     security:
   *       - Bearer: []
   *     name: getAllRole
   *     parameters:
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
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const query: FindOptions = {
        where: { roleName: { [Op.ne]: ERoleDefault.SUPER_ADMIN } },
        include: [
          {
            model: StaffModel,
            as: 'staffs',
            required: false
          }
        ]
      };
      const roles = await paginate(
        RoleModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(httpStatus.OK).send(buildSuccessMessage(roles));
    } catch (error) {
      return next(error);
    }
  };
}
