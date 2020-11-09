import Joi from 'joi';

const createTeamSchema = Joi.object({
  name: Joi.string().required().label('name'),
  locationIds: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.string()
        .guid({ version: ['uuidv4'] })
        .required()
    )
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

const updateTeamSchema = Joi.object({
  teamId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('teamId'),
  name: Joi.string().label('name'),
  locationIds: Joi.array()
    .min(1)
    .max(100)
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .label('locationIds'),
  description: Joi.string().label('description'),
  members: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.object({
        staffId: Joi.string()
          .guid({ version: ['uuidv4'] })
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

const parentIdSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .required()
  .label('parentId');
const teamIdSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .required()
  .label('teamId');

const locationIdsSchema = Joi.array()
  .min(1)
  .items(Joi.string().guid({ version: ['uuidv4'] }))
  .allow(null)
  .label('locationIds');
export { createTeamSchema, updateTeamSchema, parentIdSchema, teamIdSchema, locationIdsSchema };
