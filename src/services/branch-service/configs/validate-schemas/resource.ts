import Joi from 'joi';

const createResourceSchema = Joi.object({
  locationId: Joi.string()
    .required()
    .label('locationId'),
  name: Joi.string()
    .required()
    .label('name'),
  excerpt: Joi.string()
    .required()
    .label('excerpt'),
  description: Joi.string()
    .required()
    .label('description'),
  serviceIds: Joi.array()
    .items(Joi.string().required())
    .required()
});

const resourceIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('resourceId');

export { createResourceSchema, resourceIdSchema };
