import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import {
  CustomerWisereModel,
  MedicalHistoryCustomerModel,
  MedicalHistoryModel
} from '../../../repositories/postgres/models';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { languageSchema, customerWisereIdSchema, updateMedicalHistorySchema } from '../configs/validate-schemas';
import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import _ from 'lodash';

export class TreatmentController extends BaseController {
  /**
   * @swagger
   * /treatment/get-all-medical-history:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getAllMedicalHistory
   *     parameters:
   *     - in: query
   *       name: language
   *       type: string
   *       enum: ['en', 'vi']
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllMedicalHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const language = req.query.language;
      const validateErrors = validate(language, languageSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      let listMedicalHistory: any;
      if (language === 'en') {
        listMedicalHistory = await MedicalHistoryModel.findAll({
          attributes: ['id', 'name']
        });
      } else {
        listMedicalHistory = await MedicalHistoryModel.findAll({
          attributes: ['id', 'name_vi']
        });
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(listMedicalHistory));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /treatment/get-medical-history-by-customer/{customerWisereId}:
   *   get:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: getMedicalHistoryByCustomer
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getMedicalHistoryByCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(customerWisereId, customerWisereIdSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const listMedicalHistory = await MedicalHistoryModel.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        include: [
          {
            model: CustomerWisereModel,
            as: 'customers',
            where: { id: customerWisereId },
            attributes: ['id'],
            through: { attributes: ['note'] }
          }
        ]
      });
      return res.status(httpStatus.OK).send(buildSuccessMessage(listMedicalHistory));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   medicalHistory:
   *       properties:
   *          medicalHistoryId:
   *             type: string
   *          note:
   *             type: string
   *
   */

  /**
   * @swagger
   * /treatment/update-medical-history-of-customer/{customerWisereId}:
   *   put:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: updateMedicalHistoryOfCustomer
   *     parameters:
   *     - in: "path"
   *       name: "customerWisereId"
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       properties:
   *          medicalHistories:
   *              type: array
   *              items:
   *                  $ref: '#/definitions/medicalHistory'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updateMedicalHistoryOfCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerWisereId = req.params.customerWisereId;
      const validateErrors = validate(req.body, updateMedicalHistorySchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const customerWisere: any = await CustomerWisereModel.findOne({
        where: { id: customerWisereId },
        include: [
          {
            model: MedicalHistoryModel,
            as: 'medicalHistories',
            required: false,
            attributes: ['id'],
            through: { attributes: [] }
          }
        ]
      });
      if (!customerWisere) {
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const currentMedicalhistory: string[] = customerWisere.medicalHistories.map((item: any) => item.id);
      const dataInput: string[] = req.body.medicalHistories.map((item: any) => item.medicalHistoryId);
      const remove = _.difference(currentMedicalhistory, dataInput);
      if (remove.length > 0) {
        await MedicalHistoryCustomerModel.destroy({
          where: { customerWisereId: customerWisereId, medicalHistoryId: remove }
        });
      }
      const add = _.difference(dataInput, currentMedicalhistory);
      if (add.length > 0) {
        for (let i = 0; i < add.length; i++) {
          const index = req.body.medicalHistories.findIndex((x: any) => x.medicalHistoryId === add[i]);
          await MedicalHistoryCustomerModel.create({
            customerWisereId: customerWisereId,
            medicalHistoryId: add[i],
            note: req.body.medicalHistories[index].note
          });
        }
      }
      // const upadte = _.intersection(dataInput, currentMedicalhistory);
      // if (upadte.length > 0) {
      //   for (let j = 0; j < upadte.length; j++) {
      //     const index = req.body.medicalHistories.findIndex((x: any) => x.medicalHistoryId === upadte[j]);
      //     await MedicalHistoryCustomerModel.update(
      //       {
      //         note: req.body.medicalHistories[index].note
      //       },
      //       {
      //         where: { customerWisereId: customerWisereId, medicalHistoryId: upadte[j] }
      //       }
      //     );
      //   }
      // }
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
