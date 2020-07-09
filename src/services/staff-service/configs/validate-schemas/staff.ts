import Joi from '@hapi/joi';

const staffIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('staffId');

export { staffIdSchema };
