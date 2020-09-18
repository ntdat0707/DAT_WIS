import Joi from 'joi';
const createPipelineSchema = Joi.object({
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

const createPipelineStageSchema = Joi.object({
  pipelineId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('pipelineId'),
  name: Joi.string().required().label('name'),
  rottingIn: Joi.number().integer().required().label('rottingIn')
});

const updatePipelineStageSchema = Joi.object({
  name: Joi.string().required().label('name'),
  rottingIn: Joi.number().integer().required().label('rottingIn')
});

const pipelineStageIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('pipelineStageId');

export { createPipelineSchema, updatePipelineSchema, pipelineIdSchema, createPipelineStageSchema, updatePipelineStageSchema, pipelineStageIdSchema };
