import Joi from 'joi';
import { EStatusPipelineStage } from '../../../../utils/consts';
const createPipelineSchema = Joi.object({
  name: Joi.string().required().label('name'),
  isActiveProbability: Joi.boolean().allow(null).label('isActiveProbability')
});

const updatePipelineSchema = Joi.object({
  name: Joi.string().allow(null).label('name'),
  isActiveProbability: Joi.boolean().allow(null).label('isActiveProbability')
});

const pipelineIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('pipelineId');

const pipelineStageIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('newPipelineStageId');

const settingPipelineStageSchema = Joi.object({
  name: Joi.string().required().label('name'),
  isActiveProbability: Joi.boolean().required().label('isActiveProbability'),
  listPipelineStage: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        id: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .allow(null),
        name: Joi.string().required(),
        rottingIn: Joi.number().integer().required(),
        probability: Joi.number().max(500).required(),
        order: Joi.number().integer().required()
      })
    )
    .label('listPipelineStage'),
  listDeletePipelineStage: Joi.array()
    .items(
      Joi.object({
        oldPipelineStageId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required(),
        movePipelineStageId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .allow(null)
      })
    )
    .allow(null)
    .label('listDeletePipelineStage')
});

const filterDeal = Joi.object({
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('customerWisereId'),
  pipelineStageId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('pipelineStageId'),
  pipelineId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('pipelineId'),
  showStatus: Joi.string().valid('all').allow(null).label('showStatus')
});

const createDealSchema = Joi.object({
  dealTitle: Joi.string().required().label('dealTitle'),
  ownerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('ownerId'),
  amount: Joi.number().integer().required().label('amount'),
  currency: Joi.string().required().label('currency'),
  probability: Joi.number().max(500).allow(null).label('probability'),
  source: Joi.string().allow(null, '').label('source'),
  expectedCloseDate: Joi.string().isoDate().required().label('expectedCloseDate'),
  note: Joi.string().allow(null, '').label('note'),
  pipelineStageId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('pipelineStageId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerWisereId')
});

const dealIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('dealId');

const updateDealSchema = Joi.object({
  dealTitle: Joi.string().required().label('dealTitle'),
  ownerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('ownerId'),
  amount: Joi.number().integer().required().label('amount'),
  currency: Joi.string().required().label('currency'),
  probability: Joi.number().max(500).allow(null).label('probability'),
  source: Joi.string().allow(null, '').label('source'),
  expectedCloseDate: Joi.string().isoDate().required().label('expectedCloseDate'),
  note: Joi.string().allow(null, '').label('note'),
  pipelineStageId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('pipelineStageId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('customerWisereId'),
  status: Joi.string()
    .allow(null)
    .valid(...Object.values(EStatusPipelineStage))
    .label('status')
});

const settingPipelineSchema = Joi.object({
  name: Joi.string().required().label('name'),
  isActiveProbability: Joi.boolean().required().label('isActiveProbability'),
  listPipelineStage: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        name: Joi.string().required(),
        rottingIn: Joi.number().integer().required(),
        probability: Joi.number().max(500).required(),
        order: Joi.number().integer().required()
      })
    )
    .label('listPipelineStage')
});

const movePipelineStageIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .allow(null)
  .label('movePipelineStageId');

const statusDealSchema = Joi.string()
  .valid(...Object.values(EStatusPipelineStage))
  .required()
  .label('status');

export {
  createPipelineSchema,
  updatePipelineSchema,
  pipelineIdSchema,
  pipelineStageIdSchema,
  settingPipelineStageSchema,
  filterDeal,
  createDealSchema,
  dealIdSchema,
  updateDealSchema,
  settingPipelineSchema,
  movePipelineStageIdSchema,
  statusDealSchema
};
