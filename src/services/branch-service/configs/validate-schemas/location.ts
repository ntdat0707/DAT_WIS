import Joi from 'joi';

const createLocationSchema = Joi.object({
  name: Joi.string().required().label('name'),
  phone: Joi.string().required().label('phone'),
  email: Joi.string().email().label('email'),
  city: Joi.string().label('city'),
  district: Joi.string().label('district'),
  ward: Joi.string().label('ward'),
  address: Joi.string().label('address'),
  latitude: Joi.number().label('latitude'),
  longitude: Joi.number().label('longitude')
});

const locationIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('locationId');

export { createLocationSchema, locationIdSchema };
