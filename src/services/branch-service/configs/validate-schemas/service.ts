import Joi from 'joi';

const createServiceSchema = Joi.object({
  cateServiceId: Joi.string().required().label('cateServiceId'),
  locationIds: Joi.array().items(Joi.string()),
  description: Joi.string().allow(null, ''),
  salePrice: Joi.number().allow(null, ''),
  color: Joi.string().allow(null, ''),
  duration: Joi.number().required(),
  staffIds: Joi.array().items(Joi.string()).required(),
  name: Joi.string().required(),
  serviceCode: Joi.string().required().allow('', null)
});

const createCateServiceSchema = Joi.object({
  name: Joi.string().required().label('name'),
  excerpt: Joi.string().required().label('excerpt'),
  companyId: Joi.string().required().label('companyId')
});

const serviceIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('serviceId');

const createServicesSchema = Joi.object({
  cateServiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('cateServiceId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  staffIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .required()
    .label('staffIds'),
  serviceDetails: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        name: Joi.string().required(),
        salePrice: Joi.number().allow(null, ''),
        duration: Joi.number().required()
      })
    )
    .label('serviceDetails')
});

const getAllServiceSchema = Joi.object({
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('staffId'),
  locationIds: Joi.array().items(
    Joi.string().guid({
      version: ['uuidv4']
    })
  )
});
export { createCateServiceSchema, createServiceSchema, serviceIdSchema, createServicesSchema, getAllServiceSchema };
