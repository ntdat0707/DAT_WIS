import Joi from 'joi';
import { ESocialType, ESourceLoginType } from '../../../../utils/consts';

const createBusinessAccountSchema = Joi.object({
  email: Joi.string().required().email().label('email'),
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  password: Joi.string().required().min(8).label('password')
});
const loginSchema = Joi.object({
  email: Joi.string().required().email().label('email'),
  password: Joi.string().required().min(8).label('password'),
  browser: Joi.string().allow('', null).label('browser'),
  os: Joi.string().allow('', null).label('os'),
  device: Joi.string().allow('', null).label('device'),
  source: Joi.string()
    .required()
    .valid(...Object.values(ESourceLoginType))
    .label('source')
});

const refreshTokenSchema = Joi.string().required().label('refreshToken');

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
  newPassword: Joi.string().required().min(8).label('newPassword')
});

const loginSocialSchema = Joi.object({
  provider: Joi.string().valid(ESocialType.FACEBOOK, ESocialType.GOOGLE).required().label('provider'),
  providerId: Joi.string().required().label('providerId'),
  token: Joi.string().required().label('token'),
  email: Joi.string().email().allow('', null).label('email'),
  fullName: Joi.string().required().label('fullName'),
  avatarPath: Joi.string().allow('', null).label('avatarPath'),
  browser: Joi.string().allow('', null).label('browser'),
  os: Joi.string().allow('', null).label('os'),
  device: Joi.string().allow('', null).label('device'),
  source: Joi.string()
    .required()
    .valid(...Object.values(ESourceLoginType))
    .label('source')
});

export {
  createBusinessAccountSchema,
  loginSchema,
  refreshTokenSchema,
  emailSchema,
  changePasswordSchema,
  loginSocialSchema
};
