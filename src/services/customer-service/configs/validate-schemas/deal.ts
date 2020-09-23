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
  rottingIn: Joi.number().integer().required().label('rottingIn'),
  order: Joi.number().integer().required().label('order')
});

const updatePipelineStageSchema = Joi.object({
  name: Joi.string().required().label('name'),
  rottingIn: Joi.number().integer().required().label('rottingIn'),
  order: Joi.number().integer().required().label('order')
});

const pipelineStageIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('pipelineStageId');

const settingPipelineStageSchema = Joi.object({
  name: Joi.string().required().label('name'),
  listPipelineStage: Joi.array()
  .min(1)
  .required()
  .items(
    Joi.object({
      id: Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .allow(null, ''),
      name: Joi.string().required(),
      rottingIn: Joi.number().integer().required(),
      order: Joi.number().integer().required()
    })
  )
  .label('listPipelineStage')
});

const filterDeal = Joi.object({
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('customerId'),
  pipelineStageId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('pipelineStageId'),
  pipelineId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('pipelineId')
});
  
export { 
  createPipelineSchema,
  updatePipelineSchema,
  pipelineIdSchema,
  createPipelineStageSchema,
  updatePipelineStageSchema,
  pipelineStageIdSchema,
  settingPipelineStageSchema,
  filterDeal
};
