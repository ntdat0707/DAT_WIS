import Joi from '@hapi/joi';

const registerSchema = Joi.object({
  email: Joi.string()
    .required()
    .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
    .label('email'),
  name: Joi.string()
    .required()
    .label('name'),
  password: Joi.string()
    .required()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
    .label('password'),
  age: Joi.number()
    .integer()
    .allow(null)
});

const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
    .label('Email'),
  password: Joi.string()
    .required()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
    .label('password')
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .label('refresh token')
});

const updateProfileSchema = Joi.object({
  email: Joi.string()
    .required()
    .regex(/^[a-z][a-z0-9_\.]{4,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/)
    .label('Email'),
  name: Joi.string()
    .required()
    .label('name'),
  phone: Joi.string()
    .required()
    .regex(/((09|03|07|08|05)+([0-9]{8})\b)/)
    .label('phone'),
  address: Joi.string()
    .allow('', null)
    .label('address'),
  cityId: Joi.number()
    .required()
    .label('cityId'),
  districtId: Joi.number()
    .required()
    .label('districtId')
});

const updatePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
    .label('newPassword'),
  retypePassword: Joi.ref('newPassword'),
  oldPassword: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/)
    .required()
    .label('oldPassword')
});

const forgotPasswordSchema = Joi.object({
  phone: Joi.string()
    .required()
    .regex(/((09|03|07|08|05)+([0-9]{8})\b)/)
    .label('phone')
});

const allowNotificationSchema = Joi.object({
  allowNotification: Joi.boolean()
    .required()
    .label('allowNotification')
});

export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  allowNotificationSchema
};
