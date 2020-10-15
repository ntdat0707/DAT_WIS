import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { createCompanyDetailSchema } from '../configs/validate-schemas/company';
import { CompanyDetailModel } from '../../../repositories/postgres/models/company-detail-model';
export class CompanyDetailController {
  /**
   * Dental , Spa , Beauty Salon, Nail Salon, Babershop, Massage.
   */

  /**
   * @swagger
   * definitions:
   *   createCompanyDetail:
   *       required:
   *           - companyId
   *           - businessName
   *           - phone
   *           - description
   *           - businessTyp
   *       properties:
   *           companyId:
   *               type: string
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
   * /branch/company-detail/create-company-detail:
   *   post:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: createCompanyDetail
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/createCompanyDetail'
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
  public createCompanyDetail = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        ...body
      };
      const validateErrors = validate(data, createCompanyDetailSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const companyDetail = await CompanyDetailModel.create({
        companyId: data.companyId,
        businessType: data.businessType,
        phone: data.phone,
        description: data.description,
        businessName: data.businessName
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(companyDetail));
    } catch (error) {
      return next(error);
    }
  };
}
