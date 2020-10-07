import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { sequelize } from '../../../repositories/postgres/models';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { initCompanySchema, updateCompanyDetailSchema } from '../configs/validate-schemas/company';
import { CompanyModel } from '../../../repositories/postgres/models';
// import { companyErrorDetails } from '../../../utils/response-messages/error-details/branch/company';
import { v4 as uuidv4 } from 'uuid';
import { CompanyDetailModel } from '../../../repositories/postgres/models/company-detail-model';
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
   *           businessType:
   *               type: string
   *               enum: [DENTAL, SPA, BEAUTY_SALON, NAIL_SALON, BABER_SHOP, MASSAGE]
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
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      let company = await CompanyModel.findOne({
        where: {
          id: companyId,
          ownerId: id
        }
      });

      if (!company) {
        const newCompanyId = uuidv4();
        transaction = await sequelize.transaction();
        const newCompanyData = {
          id: newCompanyId,
          ownerId: id
        };
        company = await CompanyModel.create(newCompanyData, { transaction });
        const companyDetailData: any[] = [];
        const companyDetailId = uuidv4();
        companyDetailData.push({
          id: companyDetailId,
          companyId: newCompanyId,
          description: data.description,
          businessName: data.businessName,
          businessType: data.businessType,
          phone: data.phone
        });
        await CompanyDetailModel.bulkCreate(companyDetailData, { transaction });
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
   *           businessType:
   *               type: string
   *               enum: [DENTAL, SPA, BEAUTY_SALON, NAIL_SALON, BABER_SHOP, MASSAGE]
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
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
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
          }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });
      company = company.dataValues;
      company = { ...company, ...company.companyDetail?.dataValues, ['companyDetail']: undefined };
      transaction = await sequelize.transaction();
      if (!company) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      } else {
        // console.log('Data::', data);
        company.phone = !data.phone ? company.phone : data.phone;
        company.businessName = !data.businessName ? company.businessName : data.businessName;
        company.businessType = !data.businessType ? company.businessType : data.businessType;
        company.description = !data.description ? company.description : data.description;
        // console.log('companyUpdate::', company);
        await CompanyDetailModel.update(
          {
            phone: company.phone,
            businessName: company.businessName,
            businessType: company.businessType,
            description: company.description
          },
          { where: { companyId: companyId }, transaction }
        );
      }
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(company));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };
}
