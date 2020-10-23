import Joi from 'joi';
const createFavoriteSchema = Joi.object({
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
    .allow(null)
    .label('locationId')
});

const getListFavoriteSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerId');
export { createFavoriteSchema, getListFavoriteSchema };
