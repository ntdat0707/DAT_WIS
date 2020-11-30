import Joi from 'joi';
import { EStatusProcedure } from '../../../../utils/consts';

const createTreatmentProcessSchema = Joi.object({
  // _id: Joi.string()
  //   .regex(/^[0-9a-fA-F]{24}$/)
  //   .label('quotationDentalDetailId'),
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
    .label('treatmentId'),
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
