import Joi from 'joi';
import { EStatusProcedure } from '../../../../utils/consts';

const createTreatmentProcessSchema = Joi.object({
  name: Joi.string().required().label('name'),
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
  createOn: Joi.string().isoDate().label('createOn'),
  procedures: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .required()
          .regex(/^[0-9a-fA-F]{24}$/)
          .label('id'),
        status: Joi.valid(...Object.values(EStatusProcedure))
          .required()
          .label('status'),
        detailTreatment: Joi.string().required().label('detailTreatment')
      })
    )
    .min(1)
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
    sentDate: Joi.string().isoDate().allow(null).label('sentDate'),
    receivedDate: Joi.string().isoDate().allow(null).label('sentDate'),
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
  name: Joi.string().label('name'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('locationId'),
  treatmentId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('prescriptionId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  createOn: Joi.date().label('createOn'),
  createdById: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('createdById'),
  procedures: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().label('id'),
        status: Joi.valid(...Object.values(EStatusProcedure)).label('status'),
        detailTreatment: Joi.string().label('detailTreatment')
      })
    )
    .min(1)
    .label('procedures'),
  prescription: Joi.object({
    prescriptionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .allow(null, '')
      .label('prescription'),
    diagnosis: Joi.string().label('diagnosis'),
    note: Joi.string().label('note'),
    drugList: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object({
          medicineId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .label('medicineId'),
          quantity: Joi.number().label('quantity'),
          note: Joi.string().label('note')
        })
      )
      .label('drugList')
  }).label('prescription')
});
export { createTreatmentProcessSchema, updateTreatmentProcessSchema };
