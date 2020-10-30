import Joi from 'joi';

const createTeamSchema = Joi.object({
  name: Joi.string().required().label('name'),
  locationIds: Joi.array()
    .min(1)
    .max(100)
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .required()
    .label('locationIds'),
  description: Joi.string().label('description'),
  members: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.object({
        staffId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .required()
          .label('staffId'),
        position: Joi.string().label('position')
      })
    ),
  subTeamIds: Joi.array()
    .min(1)
    .max(100)
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .label('subTeamIds'),
  parentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .label('parentId')
});
export { createTeamSchema };
