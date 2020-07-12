import Joi from '@hapi/joi';

const createBusinessAccountSchema = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .label('email'),
  fullName: Joi.string()
    .required()
    .label('fullName'),
  password: Joi.string()
    .required()
    .min(6)
    .label('password')
});
const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .label('email'),
  password: Joi.string()
    .required()
    .min(6)
    .label('password')
});

export { createBusinessAccountSchema, loginSchema };
