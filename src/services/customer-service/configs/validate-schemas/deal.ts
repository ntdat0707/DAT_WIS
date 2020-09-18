import Joi from 'joi';
const createPipelineSchema = Joi.object({
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId'),
  name: Joi.string().required().label('name'),
  rottingIn: Joi.number().integer().required().label('rottingIn')
});

const updatePipelineSchema = Joi.object({
  name: Joi.string().required().label('name'),
  rottingIn: Joi.number().integer().required().label('rottingIn')
});

const pipelineIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('pipelineId');

export { createPipelineSchema, updatePipelineSchema, pipelineIdSchema };
