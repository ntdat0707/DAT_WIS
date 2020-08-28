import Joi from 'joi';
import { EServiceStatus } from '../../../../utils/consts';

const createServiceSchema = Joi.object({
  cateServiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('cateServiceId'),
  locationIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .min(1)
    .required(),
  description: Joi.string().allow(null, ''),
  salePrice: Joi.number().allow(null, ''),
  color: Joi.string().required().label('color'),
  duration: Joi.number().required(),
  staffIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .min(1)
    .required(),
  name: Joi.string().required(),
  serviceCode: Joi.string().required().allow('', null),
  isAllowedMarketplace: Joi.boolean().required().label('isAllowedMarketplace')
});

const createCateServiceSchema = Joi.object({
  name: Joi.string().required().label('name'),
  excerpt: Joi.string().required().label('excerpt'),
  companyId: Joi.string().required().label('companyId'),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i)
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

const updateCateServiceSchema = Joi.object({
  id: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('id'),
  name: Joi.string().required().label('name'),
  excerpt: Joi.string().required().label('excerpt'),
  companyId: Joi.string().required().label('companyId'),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i)
});
const cateServiceIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required();

const updateServiceSchema = Joi.object({
  serviceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('serviceId'),
  cateServiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .disallow(null)
    .label('cateServiceId'),
  locationIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .allow(null),
  deleteImages: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .allow(null),
  description: Joi.string().allow(null, ''),
  salePrice: Joi.number().allow(null, ''),
  color: Joi.string().disallow('', null).label('color'),
  duration: Joi.number().disallow(0, null),
  staffIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .allow(null),
  name: Joi.string().disallow('', null),
  serviceCode: Joi.string().disallow('', null),
  isAllowedMarketplace: Joi.boolean().required().label('isAllowedMarketplace'),
  status: Joi.string().required().label('status').valid(EServiceStatus.ACTIVE, EServiceStatus.IN_ACTIVE)
});
export {
  createCateServiceSchema,
  createServiceSchema,
  serviceIdSchema,
  createServicesSchema,
  getAllServiceSchema,
  updateCateServiceSchema,
  cateServiceIdSchema,
  updateServiceSchema
};
