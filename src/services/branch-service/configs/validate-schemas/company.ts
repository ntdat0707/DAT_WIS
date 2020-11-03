import Joi from 'joi';
import { EBusinessType } from '../../../../utils/consts';

const initCompanySchema = Joi.object({
  businessName: Joi.string().required().label('businessName'), //***
  phone: Joi.string().required(),
  description: Joi.string().required(), // *****
  businessType: Joi.string() // ******
    .valid(...Object.values(EBusinessType))
    .allow(null)
});

const updateCompanyDetailSchema = Joi.object({
  description: Joi.string().required(),
  phone: Joi.string().required(),
  businessName: Joi.string().required(),
  businessType: Joi.string()
    .valid(...Object.values(EBusinessType))
    .allow(null)
});

const createCompanyDetailSchema = Joi.object({
  description: Joi.string().required(),
  phone: Joi.string().required(),
  businessName: Joi.string().required(),
  businessType: Joi.string()
    .valid(...Object.values(EBusinessType))
    .allow(null)
});

export { initCompanySchema, updateCompanyDetailSchema, createCompanyDetailSchema };
