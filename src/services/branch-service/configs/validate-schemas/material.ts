import Joi from 'joi';

const createMaterialSchema = Joi.object({
  code: Joi.string().required().label('code'),
  name: Joi.string().required().label('name'),
  unit: Joi.string().required().label('unit'),
  price: Joi.string().required().label('price')
});

const materialIdSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .label('materialId');

const updateMaterialSchema = Joi.object({
  materialId: Joi.string()
    .required()
    .guid({ version: ['uuidv4'] })
    .label('materialId'),
  code: Joi.string().label('code'),
  name: Joi.string().label('name'),
  unit: Joi.string().label('unit'),
  price: Joi.string().label('price')
});
export { createMaterialSchema, materialIdSchema, updateMaterialSchema };
