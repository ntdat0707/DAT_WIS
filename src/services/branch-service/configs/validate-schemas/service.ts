import Joi from 'joi';

const createServiceSchema = Joi.object({
  cateServiceId: Joi.string().required().label('cateServiceId'),
  locationId: Joi.string().required().label('locationId'),
  description: Joi.string().required(),
  salePrice: Joi.number().required(),
  color: Joi.string().required(),
  duration: Joi.number().required(),
  staffIds: Joi.array().items(Joi.string()).required()
});

const createCateServiceSchema = Joi.object({
  name: Joi.string().required().label('name'),
  excerpt: Joi.string().required().label('excerpt'),
  companyId: Joi.string().required().label('companyId')
});

export { createCateServiceSchema, createServiceSchema };
