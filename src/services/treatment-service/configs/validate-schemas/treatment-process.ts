import Joi from 'joi';
import { EStatusProcedure } from '../../../../utils/consts';

const createTreatmentProcessSchema = Joi.object({
  name: Joi.string().max(80).required().label('name'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  treatmentId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('treatmentId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  createOn: Joi.date().label('createOn'),
  procedures: Joi.array()
    .items(
      Joi.object({
        procedureId: Joi.string()
          .required()
          .regex(/^[0-9a-fA-F]{24}$/)
          .label('procedureId'),
        status: Joi.valid(...Object.values(EStatusProcedure))
          .required()
          .label('status'),
        assistantId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('assistantId'),
        detailTreatment: Joi.string().required().label('detailTreatment')
      })
    )
    .min(1)
    .required()
    .label('procedures'),
  prescription: Joi.object({
    diagnosis: Joi.string().required().label('diagnosis'),
    note: Joi.string().label('note'),
    drugList: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object({
          medicineId: Joi.string()
            .required()
            .regex(/^[0-9a-fA-F]{24}$/)
            .label('medicineId'),
          quantity: Joi.number().integer().min(1).required().label('quantity'),
          note: Joi.string().allow(null, '').label('note')
        })
      )
      .label('drugList')
  })
    .allow(null)
    .label('prescription'),
  labo: Joi.object({
    status: Joi.string().required().valid('ordered', 'deliveried').label('status'),
    customerId: Joi.string()
      .guid({
        version: ['uuidv4']
      })
      .required()
      .label('customerId'),
    staffId: Joi.string()
      .guid({
        version: ['uuidv4']
      })
      .required()
      .label('staffId'),
    labo: Joi.string().required().label('labo'),
    sentDate: Joi.date().allow(null).label('sentDate'),
    receivedDate: Joi.date().allow(null).label('sentDate'),
    diagnostic: Joi.string().required().label('diagnostic'),
    note: Joi.string().allow(null).label('note')
  })
    .allow(null)
    .label('labo')
});
const updateTreatmentProcessSchema = Joi.object({
  treatmentProcessId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('treatmentProcessId'),
  name: Joi.string().max(80).required().label('name'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  createOn: Joi.date().label('createOn'),
  procedures: Joi.array()
    .items(
      Joi.object({
        procedureId: Joi.string().required().label('procedureId'),
        status: Joi.valid(...Object.values(EStatusProcedure))
          .required()
          .label('status'),
        assistantId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('assistantId'),
        detailTreatment: Joi.string().required().label('detailTreatment')
      })
    )
    .min(1)
    .required()
    .label('procedures'),
  prescription: Joi.object({
    prescriptionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .allow(null, '')
      .label('prescription'),
    diagnosis: Joi.string().required().label('diagnosis'),
    note: Joi.string().allow(null, '').label('note'),
    drugList: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object({
          medicineId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .label('medicineId'),
          quantity: Joi.number().integer().min(1).required().label('quantity'),
          note: Joi.string().allow(null, '').label('note')
        })
      )
      .label('drugList')
  })
    .allow(null)
    .label('prescription'),
  labo: Joi.object({
    laboId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .label('laboId'),
    status: Joi.string().required().valid('ordered', 'deliveried').label('status'),
    customerId: Joi.string()
      .guid({
        version: ['uuidv4']
      })
      .required()
      .label('customerId'),
    staffId: Joi.string()
      .guid({
        version: ['uuidv4']
      })
      .required()
      .label('staffId'),
    labo: Joi.string().required().label('labo'),
    sentDate: Joi.date().allow(null).label('sentDate'),
    receivedDate: Joi.date().allow(null).label('sentDate'),
    diagnostic: Joi.string().required().label('diagnostic'),
    note: Joi.string().allow(null).label('note')
  })
    .allow(null)
    .label('labo')
});
export { createTreatmentProcessSchema, updateTreatmentProcessSchema };
