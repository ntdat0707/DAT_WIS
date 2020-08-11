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

const emailSchema = Joi.object({
  email: Joi.string().required().email().label('email')
});

const changePasswordSchema = Joi.object({
  token: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('token'),
  newPassword: Joi.string().required().min(6).label('newPassword')
});

const loginSocialSchema = Joi.object({
  provider: Joi.string().required().label('provider'),
  providerId: Joi.string().required().label('providerId'),
  email: Joi.string().email().label('email'),
  fullName: Joi.string().required().label('fullName'),
  avatarPath: Joi.string().label('avatarPath')
});

export {
  createBusinessAccountSchema,
  loginSchema,
  refreshTokensChema,
  emailSchema,
  changePasswordSchema,
  loginSocialSchema
};
