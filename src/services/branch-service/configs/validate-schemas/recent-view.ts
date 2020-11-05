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

const deleteRecentSearhcSchema = Joi.object({
  recentSearchId: Joi.string()
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

export { createRecentViewSchema, deleteRecentViewSchema, deleteRecentBookingSchema, deleteRecentSearhcSchema };
