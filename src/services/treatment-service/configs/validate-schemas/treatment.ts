import Joi from 'joi';
import { EStatusTreatment } from '../../../../utils/consts';

const languageSchema = Joi.string().valid('en', 'vi').required().label('language');

const customerWisereIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerWisereId');

const updateMedicalHistorySchema = Joi.object({
  medicalHistories: Joi.array()
    .items(
      Joi.object({
        medicalHistoryId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('medicalHistoryId'),
        note: Joi.string().max(150).allow(null, '').label('note')
      })
    )
    .label('medicalHistories')
});

const createProcedureSchema = Joi.object({
  treatmentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('treatmentId'),
  procedures: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        staffId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('staffId'),
        teethNumber: Joi.array().items(Joi.number().integer()).required().label('teethNumber'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        quantity: Joi.number().integer().min(1).required().label('quantity'),
        discount: Joi.number().integer().min(0).allow(null).label('discount'),
        totalPrice: Joi.number().integer().min(1).required().label('totalPrice'),
        note: Joi.string().max(150).allow(null, '').label('note')
      })
    )
    .label('procedures')
});

const createTreatmentSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(EStatusTreatment))
    .required()
    .label('status'),
  creatorId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('creatorId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId')
});

const treatmentIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required()
  .label('treatmentId');

const procedureSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required()
  .label('procedureSchema');
export {
  languageSchema,
  customerWisereIdSchema,
  updateMedicalHistorySchema,
  createProcedureSchema,
  createTreatmentSchema,
  treatmentIdSchema,
  procedureSchema
};
