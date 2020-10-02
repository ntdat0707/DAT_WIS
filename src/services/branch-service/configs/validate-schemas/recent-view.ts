import Joi from 'joi';

const createRecentViewSchema = Joi.object({
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId')
});

const deleteRecentViewSchema = Joi.object({
  recentViewId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('recentViewId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId')
});

const deleteRecentBookingSchema = Joi.object({
  recentBookingId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('recentBookingId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId')
});

const suggestCountryAndCity = Joi.string().label('countryCode');

export { createRecentViewSchema, deleteRecentViewSchema, deleteRecentBookingSchema, suggestCountryAndCity };
