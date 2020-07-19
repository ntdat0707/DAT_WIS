import Joi from '@hapi/joi';

const createResourceSchema = Joi.object({
  locationId: Joi.string()
    .required()
    .label('locationId'),
  description: Joi.string()
    .required()
    .label('description'),
  serviceIds: Joi.array()
    .items(Joi.string().required())
    .required()
});

export { createResourceSchema };
