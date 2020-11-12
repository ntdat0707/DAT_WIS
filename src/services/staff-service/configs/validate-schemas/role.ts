import Joi from 'joi';

const createRoleSchema = Joi.object({
  roleName: Joi.string().max(50).required().label('roleName'),
  description: Joi.string().max(255).allow(null, '').label('description')
});

const updateRoleSchema = Joi.object({
  roleName: Joi.string().max(50).required().label('roleName'),
  description: Joi.string().max(255).allow(null, '').label('description')
});

const roleIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('roleId');

export { createRoleSchema, updateRoleSchema, roleIdSchema };
