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

const updateTeamSchema = Joi.object({
  teamId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('name'),
  name: Joi.string().label('name'),
  locationIdsUpdate: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.object({
        id: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('id'),
        oldLocationId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('oldLocationId'),
        newLocationId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('newLocationId')
      }).label('locationIdsUpdate')
    ),
  description: Joi.string().label('description'),
  members: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.object({
        id: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('id'),
        oldStaffId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('oldStaffId'),
        newStaffId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('newStaffId'),
        position: Joi.string().label('position')
      })
    ),
  subTeamIds: Joi.array()
    .min(1)
    .max(100)
    .items(
      Joi.object({
        id: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('id'),
        oldSubTeamId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('oldSubTeamId'),
        newSubTeamId: Joi.string()
          .guid({ version: ['uuidv4'] })
          .label('newSubTeamId')
      })
    )
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
  .label('teamID');
export { createTeamSchema, updateTeamSchema, parentIdSchema, teamIdSchema };
