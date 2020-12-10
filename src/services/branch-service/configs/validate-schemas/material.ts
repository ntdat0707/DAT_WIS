import Joi from 'joi';

const createMaterialSchema = Joi.object({
  code: Joi.string().required().label('code'),
  name: Joi.string().required().label('name'),
  unit: Joi.string().required().label('unit'),
  price: Joi.string().required().label('price')
});

export { createMaterialSchema };
