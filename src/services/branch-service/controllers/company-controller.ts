import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { CompanyTypeDetailModel, CompanyTypeModel, sequelize } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { initCompanySchema, updateCompanyDetailSchema } from '../configs/validate-schemas/company';
import { CompanyModel } from '../../../repositories/postgres/models';
import { CompanyDetailModel } from '../../../repositories/postgres/models/company-detail-model';
import _ from 'lodash';
import { companyErrorDetails } from '../../../utils/response-messages/error-details/branch/company';
export class CompanyController {
  /**
   * Dental , Spa , Beauty Salon, Nail Salon, Babershop, Massage.
   */

  /**
   * @swagger
   * definitions:
   *   initCompany:
   *       required:
   *           - businessName
   *           - phone
   *       properties:
   *           businessName:
   *               type: string
   *           phone:
   *               type: string
   *           description:
   *               type: string
   *           companyTypeDetailIds:
   *               type: array
   *               items: string
   *
   */

  /**
   * @swagger
   * /branch/company/init:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: initCompany
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/initCompany'
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
  public initCompany = async ({ body }: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { companyId, id } = res.locals.staffPayload;
      const data: any = {
        ...body
      };
      const validateErrors = validate(data, initCompanySchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      let company = await CompanyModel.findOne({
        where: {
          id: companyId,
          ownerId: id
        }
      });
      if (!company) {
        company = await CompanyModel.create({ ownerId: id }, { transaction });
        const companyDetailData = {
          companyId: company.id,
          description: data.description,
          businessName: data.businessName,
          phone: data.phone
        };
        transaction = await sequelize.transaction();
        await CompanyDetailModel.create(companyDetailData, { transaction });

        if (data.companyTypeDetailIds.length > 0) {
          const companyTypeData: any = [];
          for (const companyTypeDetailId of data.companyTypeDetailIds) {
            const companyTypeDetail = await CompanyTypeDetailModel.findOne({ where: { id: companyTypeDetailId } });
            if (!companyTypeDetail) {
              throw new CustomError(companyErrorDetails.E_4003(`Company type detail ${companyTypeDetailId} not found`));
            }
            const companyType = {
              companyId: company.id,
              companyTypeDetailId: companyTypeDetailId
            };
            companyTypeData.push(companyType);
          }
          await CompanyTypeModel.bulkCreate(companyTypeData, { transaction });
        }
        await transaction.commit();
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(company));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateCompany:
   *       properties:
   *           businessName:
   *               type: string
   *           phone:
   *               type: string
   *           description:
   *               type: string
   *           companyTypeDetailIds:
   *               type: array
   *               items: string
   *
   */

  /**
   * @swagger
   * /branch/company/update-company:
   *   put:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: updateCompany
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateCompany'
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

  public updateCompany = async ({ body }: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { companyId, id } = res.locals.staffPayload;
      const data: any = {
        ...body
      };
      const validateErrors = validate(data, updateCompanyDetailSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      let company: any = await CompanyModel.findOne({
        where: {
          id: companyId,
          ownerId: id
        },
        include: [
          {
            model: CompanyDetailModel,
            as: 'companyDetail',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: CompanyTypeDetailModel,
            as: 'companyTypeDetails',
            through: { attributes: [] },
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });
      company = company.dataValues;
      company = { ...company, ...company.companyDetail?.dataValues, ['companyDetail']: undefined };

      if (!company) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      } else {
        company.phone = !data.phone ? company.phone : data.phone;
        company.businessName = !data.businessName ? company.businessName : data.businessName;
        company.description = !data.description ? company.description : data.description;
        transaction = await sequelize.transaction();
        await CompanyDetailModel.update(
          {
            phone: company.phone,
            businessName: company.businessName,
            description: company.description
          },
          { where: { companyId: companyId }, transaction }
        );
        for (const companyTypeDetailId of data.companyTypeDetailIds) {
          const companyTypeDetail = await CompanyTypeDetailModel.findOne({ where: { id: companyTypeDetailId } });
          if (!companyTypeDetail) {
            throw new CustomError(companyErrorDetails.E_4003(`Company type detail ${companyTypeDetailId} not found`));
          }
        }
        const curCompanyTypeDetailIds = (
          await CompanyTypeModel.findAll({
            where: { companyId: companyId }
          })
        ).map((companyType: any) => companyType.companyTypeDetailId);
        const removeCompanyTypeDetailIds = _.difference(curCompanyTypeDetailIds, data.companyTypeDetailIds as string[]);
        if (removeCompanyTypeDetailIds.length > 0) {
          await CompanyTypeModel.destroy({ where: { companyTypeDetailId: removeCompanyTypeDetailIds }, transaction });
        }
        const addCompanyTypeDetailIds = _.difference(data.companyTypeDetailIds, curCompanyTypeDetailIds as string[]);
        if (addCompanyTypeDetailIds.length > 0) {
          const companyTypes = (addCompanyTypeDetailIds as []).map((companyTypeDetailId: any) => ({
            companyId: companyId,
            companyTypeDetailId: companyTypeDetailId
          }));
          await CompanyTypeModel.bulkCreate(companyTypes, { transaction });
        }
      }
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/company/market-place/get-company-type-detail:
   *   get:
   *     tags:
   *       - Branch
   *     name: getCompanyType
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
  public getCompanyTypeDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyTypes = await CompanyTypeDetailModel.findAll();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(companyTypes));
    } catch (error) {
      return next(error);
    }
  };
}
