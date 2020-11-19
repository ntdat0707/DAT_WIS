import Joi, { string } from 'joi';

const initCompanySchema = Joi.object({
  businessName: Joi.string().required().label('businessName'), //***
  phone: Joi.string().required(),
  description: Joi.string().required(), // *****
  companyDetailIds: Joi.array()
    .min(1)
    .items({
      Joi: string().guid({ version: ['uuidv4'] })
    })
    .label('companyDetailIds'),
  lengthCode: Joi.number().min(1).required().label('lengthCode')
});

const updateCompanyDetailSchema = Joi.object({
  description: Joi.string().label('description'),
  phone: Joi.string().label('phone'),
  businessName: Joi.string().label('businessName'),
  companyTypeDetailIds: Joi.array()
    .min(1)
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .label('companyTypeDetailIds'),
  lengthCode: Joi.number().min(1).label('lengthCode')
});

export { initCompanySchema, updateCompanyDetailSchema };
