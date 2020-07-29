import Joi from 'joi';

const createBusinessAccountSchema = Joi.object({
  email: Joi.string().required().email().label('email'),
  fullName: Joi.string().required().label('fullName'),
  password: Joi.string().required().min(6).label('password')
});
const loginSchema = Joi.object({
  email: Joi.string().required().email().label('email'),
  password: Joi.string().required().min(6).label('password')
});

const refreshTokensChema = Joi.string().required().label('refreshToken');

export { createBusinessAccountSchema, loginSchema, refreshTokensChema };
