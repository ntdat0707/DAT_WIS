import Joi from 'joi';
import { EStatusProcedure } from '../../../../utils/consts';

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
  procedures: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        treatmentId: Joi.string().required().label('treatmentId'),
        staffId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('staffId'),
        teethId: Joi.array().items(Joi.string()).required().label('teethId'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        quantity: Joi.number().integer().min(1).required().label('quantity'),
        discount: Joi.number().integer().min(0).allow(null).label('discount'),
        totalPrice: Joi.number().integer().min(1).required().label('totalPrice'),
        status: Joi.string()
          .valid(...Object.values(EStatusProcedure))
          .required()
          .label('status'),
        note: Joi.string().allow(null, '').label('note')
      })
    )
    .label('procedures')
});
export { languageSchema, customerWisereIdSchema, updateMedicalHistorySchema, createProcedureSchema };
