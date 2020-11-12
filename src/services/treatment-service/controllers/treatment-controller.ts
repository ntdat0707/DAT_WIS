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
   *          type: array
   *          items:
   *             $ref: '#/definitions/medicalHistory'
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
      const customerWisere = await CustomerWisereModel.findOne({ where: { id: customerWisereId } });
      if (!customerWisere) {
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${customerWisereId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await MedicalHistoryCustomerModel.destroy({ where: { customerWisereId: customerWisereId } });
      if (req.body.medicalHistories.length > 0) {
        const medicalHistoryCustomers = [];
        for (let i = 0; i < req.body.medicalHistories.length; i++) {
          const data = {
            customerWisereId: customerWisereId,
            medicalHistoryId: req.body.medicalHistories.medicalHistoryId,
            note: req.body.note
          };
          medicalHistoryCustomers.push(data);
        }
        await MedicalHistoryCustomerModel.bulkCreate(medicalHistoryCustomers);
      }
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };
}
