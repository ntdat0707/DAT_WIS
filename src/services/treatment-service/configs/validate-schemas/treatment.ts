import Joi from 'joi';
import { EQuotationDiscountType, EStatusTreatment } from '../../../../utils/consts';
import { TEETH_2H, TEETH_ADULT, TEETH_CHILD } from '../consts';

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
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId'),
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
        teethNumbers: Joi.array()
          .items(Joi.string().valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD))
          .required()
          .label('teethNumbers'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        quantity: Joi.number().integer().min(1).required().label('quantity'),
        discount: Joi.number().integer().min(0).allow(null).label('discount'),
        discountType: Joi.string()
          .valid(...Object.values(EQuotationDiscountType))
          .label('discountType'),
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
  .label('treatmentIdSchema');

const procedureSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required()
  .label('procedureSchema');

const treatmentProcessIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required()
  .label('treatmentProcessId');

const getAllProcedureSchema = Joi.object({
  treatmentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('treatmentId'),
  isTreatmentProcess: Joi.boolean().allow(null).label('isTreatmentProcess')
});

export {
  languageSchema,
  customerWisereIdSchema,
  updateMedicalHistorySchema,
  createProcedureSchema,
  createTreatmentSchema,
  treatmentIdSchema,
  procedureSchema,
  treatmentProcessIdSchema,
  getAllProcedureSchema
};
