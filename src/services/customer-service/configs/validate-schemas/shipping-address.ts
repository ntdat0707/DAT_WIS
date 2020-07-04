import Joi from '@hapi/joi';

const createShippingAddressSchema = Joi.object({
  name: Joi.string()
    .required()
    .label('name'),
  email: Joi.string()
    .required()
    .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
    .label('Email'),
  phone: Joi.string()
    .required()
    .regex(/((09|03|07|08|05)+([0-9]{8})\b)/)
    .label('phone'),
  customerId: Joi.number()
    .required()
    .label('customerId'),
  cityId: Joi.number()
    .required()
    .label('cityId'),
  districtId: Joi.number()
    .required()
    .label('districtId'),
  wardId: Joi.number()
    .required()
    .label('districtId'),
  address: Joi.string()
    .required()
    .allow('', null)
    .label('address'),
  isDefault: Joi.boolean()
    .allow('', null)
    .label('isDefault')
});

const updateShippingAddressSchema = Joi.object({
  shippingAddressId: Joi.number()
    .required()
    .label('shippingAddressId'),
  name: Joi.string()
    .required()
    .label('name'),
  email: Joi.string()
    .required()
    .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
    .label('Email'),
  phone: Joi.string()
    .required()
    .regex(/((09|03|07|08|05)+([0-9]{8})\b)/)
    .label('phone'),
  customerId: Joi.number()
    .required()
    .label('customerId'),
  cityId: Joi.number()
    .required()
    .label('cityId'),
  districtId: Joi.number()
    .required()
    .label('districtId'),
  wardId: Joi.number()
    .required()
    .label('districtId'),
  address: Joi.string()
    .required()
    .allow('', null)
    .label('address'),
  isDefault: Joi.boolean()
    .allow('', null)
    .label('isDefault')
});

const shippingAddressIdSchema = Joi.number()
  .required()
  .label('shippingAddressId');

export { createShippingAddressSchema, updateShippingAddressSchema, shippingAddressIdSchema };
