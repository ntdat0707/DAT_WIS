import Joi from 'joi';
import { BusinessType } from '../../../../utils/consts';

const initCompanySchema = Joi.object({
  businessName: Joi.string().required().label('businessName'),//*** 
  phone: Joi.string().required(),
  description: Joi.string().required(), // *****
  businessType: Joi.string() // ******
    .valid(...Object.keys(BusinessType))
    .allow(null)
});

const createCompanyDetailSchema = Joi.object({
  description: Joi.string().required(),
  phone: Joi.string().required(),
  companyId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('companyId'),
  businessName: Joi.string().required(),
  businessType: Joi.string()
    .valid(...Object.keys(BusinessType))
    .allow(null),
});
export { initCompanySchema, createCompanyDetailSchema };
