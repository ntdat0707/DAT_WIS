import Joi from '@hapi/joi';

const createServiceSchema = Joi.object({
  status: Joi.string()
    .required()
    .label('status'),
  cateServiceId: Joi.string()
    .required()
    .label('cateServiceId'),
  locationId: Joi.string()
    .email()
    .required()
    .label('email'),
  description: Joi.string().required(),
  salePrice: Joi.number().required(),
  color: Joi.string().required(),
  duration: Joi.number().required()
});

const createCateServiceSchema = Joi.object({
  name: Joi.string()
    .required()
    .label('name'),
  excerpt: Joi.string()
    .required()
    .label('excerpt'),
  companyId: Joi.string()
    .required()
    .label('companyId')
});

export { createCateServiceSchema, createServiceSchema };
