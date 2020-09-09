import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { initCompanySchema } from '../configs/validate-schemas/company';
import { CompanyModel } from '../../../repositories/postgres/models';
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
        return next(
          new CustomError(companyErrorDetails.E_4000(`company ${companyId} not found`), HttpStatus.NOT_FOUND)
        );
      }
      company = await company.update({
        businessType: data.businessType,
        phone: data.phone,
        description:data.description,
        businessName: data.businessName
      });

      return res.status(HttpStatus.OK).send(buildSuccessMessage(company));
    } catch (error) {
      return next(error);
    }
  };
}
