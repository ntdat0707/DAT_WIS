import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import {
  CustomerWisereModel,
  MedicalHistoryCustomerModel,
  MedicalHistoryModel,
  MedicineModel,
  sequelize,
  ServiceModel,
  StaffModel
} from '../../../repositories/postgres/models';
import { CustomError } from '../../../utils/error-handlers';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { validate } from '../../../utils/validator';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import {
  languageSchema,
  customerWisereIdSchema,
  updateMedicalHistorySchema,
  createTreatmentSchema
} from '../configs/validate-schemas';
import {
  customerErrorDetails,
  staffErrorDetails,
  medicineErrorDetails
} from '../../../utils/response-messages/error-details';
import _ from 'lodash';
import { TreatmentDetailModel } from '../../../repositories/mongo/models';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';

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
          attributes: ['id', 'nameVi']
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
      let listMedicalHistory: any = await MedicalHistoryModel.findAll({
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
      listMedicalHistory = listMedicalHistory.map((medicalHistory: any) => ({
        ...medicalHistory.dataValues,
        ...medicalHistory.customers[0]?.MedicalHistoryCustomerModel?.dataValues,
        customers: undefined
      }));
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
    let transaction = null;
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
      const removeMedicalhistory = _.difference(currentMedicalhistory, dataInput);
      transaction = await sequelize.transaction();
      if (removeMedicalhistory.length > 0) {
        await MedicalHistoryCustomerModel.destroy({
          where: { customerWisereId: customerWisereId, medicalHistoryId: removeMedicalhistory },
          transaction
        });
      }
      const addMedicalhistory = _.difference(dataInput, currentMedicalhistory);
      if (addMedicalhistory.length > 0) {
        const listMedicalHistory = [];
        for (let i = 0; i < addMedicalhistory.length; i++) {
          const index = req.body.medicalHistories.findIndex((x: any) => x.medicalHistoryId === addMedicalhistory[i]);
          const data = {
            customerWisereId: customerWisereId,
            medicalHistoryId: addMedicalhistory[i],
            note: req.body.medicalHistories[index].note
          };
          listMedicalHistory.push(data);
        }
        await MedicalHistoryCustomerModel.bulkCreate(listMedicalHistory, { transaction });
      }
      const upadateMedicalhistory = _.intersection(dataInput, currentMedicalhistory);
      if (upadateMedicalhistory.length > 0) {
        for (let j = 0; j < upadateMedicalhistory.length; j++) {
          const index = req.body.medicalHistories.findIndex(
            (x: any) => x.medicalHistoryId === upadateMedicalhistory[j]
          );
          await MedicalHistoryCustomerModel.update(
            {
              note: req.body.medicalHistories[index].note
            },
            {
              where: { customerWisereId: customerWisereId, medicalHistoryId: upadateMedicalhistory[j] },
              transaction
            }
          );
        }
      }
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   prescriptionDetail:
   *       properties:
   *           medicineId:
   *               type: string
   *           quantity:
   *               type: integer
   *           noteMedicine:
   *               type: string
   *           notePrescription:
   *               type: string
   *
   */

  /**
   * @swagger
   * definitions:
   *   treatmentCreate:
   *       properties:
   *           teethId:
   *               type: array
   *               items:
   *                   type: string
   *           serviceId:
   *               type: string
   *           staffId:
   *               type: string
   *           procedureId:
   *               type: string
   *           status:
   *               type: string
   *           diagnoseId:
   *               type: string
   *           note:
   *               type: string
   *           startDate:
   *               type: string
   *           endDate:
   *               type: string
   *           prescription:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/prescriptionDetail'
   *
   */
  /**
   * @swagger
   * /treatment/create-treatment:
   *   post:
   *     tags:
   *       - Treatment
   *     security:
   *       - Bearer: []
   *     name: createTreatment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       properties:
   *           treatments:
   *               type: array
   *               items:
   *                    $ref: '#/definitions/treatmentCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createTreatment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.body, createTreatmentSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const dataTreatments = [];
      for (let i = 0; i < req.body.treatments.length; i++) {
        const service = await ServiceModel.findOne({ where: { id: req.body.treatments[i].serviceId } });

        if (!service) {
          throw new CustomError(
            serviceErrorDetails.E_1203(`serviceId ${req.body.treatments[i].serviceId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const staff = await StaffModel.findOne({ where: { id: req.body.treatments[i].staffId } });
        if (!staff) {
          throw new CustomError(
            staffErrorDetails.E_4000(`staffId ${req.body.treatments[i].staffId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        if (req.body.treatments[i].prescription) {
          for (let j = 0; j < req.body.treatments[i].prescription.length; j++) {
            const medicine = await MedicineModel.findOne({
              where: { id: req.body.treatments[i].prescription[j].medicineId }
            });
            if (!medicine) {
              throw new CustomError(
                medicineErrorDetails.E_3900(
                  `medicineId ${req.body.treatments[i].prescription[j].medicineId} not found`
                ),
                httpStatus.NOT_FOUND
              );
            }
          }
        }
        const data = {
          serviceName: service.name,
          price: service.salePrice,
          ...req.body.treatments[i]
        };
        dataTreatments.push(data);
      }
      const treatment = await TreatmentDetailModel.insertMany(dataTreatments);
      return res.status(httpStatus.OK).send(buildSuccessMessage(treatment));
    } catch (error) {
      return next(error);
    }
  };
}
