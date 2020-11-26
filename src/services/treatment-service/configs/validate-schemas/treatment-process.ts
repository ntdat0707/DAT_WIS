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
  locationName: Joi.string().label('locationName'),
  staffId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('staffId'),
  staffName: Joi.string().label('staffName'),
  processDescription: Joi.string().label('processDescription'),
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
  createdByName: Joi.string().label('createdByName'),
  procedures: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().label('id'),
        status: Joi.valid(...Object.values(EStatusProcedure)).label('status')
      })
    )
    .min(1)
    .required()
    .label('procedures'),
  detailTreatment: Joi.string().label('detailTreatment'),
  prescription: Joi.object({
    diagnosis: Joi.string().label('diagnosis'),
    note: Joi.string().label('note'),
    createDate: Joi.date().label('createDate'),
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

export { createTreatmentProcessSchema };
