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
    .label('companyDetailIds')
});

const updateCompanyDetailSchema = Joi.object({
  description: Joi.string().required(),
  phone: Joi.string().required(),
  businessName: Joi.string().required(),
  companyTypeDetailIds: Joi.array()
    .min(1)
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .label('companyTypeDetailIds')
});

export { initCompanySchema, updateCompanyDetailSchema };
