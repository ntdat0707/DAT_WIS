import Joi from 'joi';
import { EGender, ESocialType, ESource, ELabel, EContactType } from '../../../../utils/consts';

const createCustomerWisereSchema = Joi.object({
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number()
    .integer()
    .allow(null)
    .valid(...Object.values(EGender))
    .label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().allow(null).email().label('email'),
  birthDate: Joi.string().isoDate().label('birthDate'),
  passportNumber: Joi.string().label('passportNumber'),
  address: Joi.string().label('address'),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i),
  source: Joi.string()
    .valid(...Object.values(ESource))
    .label('source'),
  label: Joi.string()
    .valid(...Object.values(ELabel))
    .label('label'),
  note: Joi.string().label('note'),
  job: Joi.string().label('job'),
  ownerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('ownerId'),
  moreEmailContact: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().required().email().label('email'),
        type: Joi.string().required().valid(EContactType.HOME, EContactType.WORK, EContactType.OTHER).label('type')
      })
    )
    .label('moreEmailContact'),
  morePhoneContact: Joi.array()
    .items(
      Joi.object({
        phone: Joi.string().regex(/^\d+$/).required().label('phone'),
        type: Joi.string()
          .required()
          .valid(EContactType.HOME, EContactType.WORK, EContactType.OTHER, EContactType.MOBILE)
          .label('type')
      })
    )
    .label('morePhoneContact'),
  code: Joi.string().min(1).max(10).uppercase().label('code')
  //prefixCode: Joi.string().min(1).max(10).uppercase().label('prefixCode')
});

const updateCustomerWisereSchema = Joi.object({
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerWisereId'),
  firstName: Joi.string().disallow(null, '').label('firstName'),
  lastName: Joi.string().disallow(null, '').label('lastName'),
  gender: Joi.number().integer().disallow(null, '').valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).disallow(null, '').label('phone'),
  email: Joi.string().allow(null, '').email().label('email'),
  birthDate: Joi.string().allow(null).isoDate().label('birthDate'),
  passportNumber: Joi.string().allow(null, '').label('passportNumber'),
  address: Joi.string().allow(null, '').label('address'),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i),
  source: Joi.string()
    .allow(null)
    .valid(ESource.FACEBOOK, ESource.MARKETPLACE, ESource.OTHER, ESource.SHOPEE, ESource.WISERE, ESource.ZALO)
    .label('source'),
  label: Joi.string()
    .allow(null)
    .valid(ELabel.COLD_LEAD, ELabel.CUSTOMER, ELabel.HOT_LEAD, ELabel.NONE, ELabel.WARM_LEAD)
    .label('label'),
  note: Joi.string().allow(null, '').label('note'),
  job: Joi.string().allow(null, '').label('job'),
  ownerId: Joi.string()
    .allow(null)
    .guid({
      version: ['uuidv4']
    })
    .label('ownerId'),
  moreEmailContact: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().required().email().label('email'),
        type: Joi.string().required().valid(EContactType.HOME, EContactType.WORK, EContactType.OTHER).label('type')
      })
    )
    .label('moreEmailContact'),
  morePhoneContact: Joi.array()
    .items(
      Joi.object({
        phone: Joi.string().regex(/^\d+$/).required().label('phone'),
        type: Joi.string()
          .required()
          .valid(EContactType.HOME, EContactType.WORK, EContactType.OTHER, EContactType.MOBILE)
          .label('type')
      })
    )
    .label('morePhoneContact')
  //prefixCode: Joi.string().min(1).max(10).uppercase().label('prefixCode')
});

const customerWisereIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerWisereId');

const loginSchema = Joi.object({
  email: Joi.string().required().email().label('email'),
  password: Joi.string().required().min(8).label('password')
});

const loginSocialSchema = Joi.object({
  provider: Joi.string().valid(ESocialType.FACEBOOK, ESocialType.GOOGLE).required().label('provider'),
  providerId: Joi.string().required().label('providerId'),
  token: Joi.string().required().label('token'),
  email: Joi.string().email().allow('', null).label('email'),
  fullName: Joi.string().required().label('fullName'),
  avatarPath: Joi.string().allow('', null).label('avatarPath')
});

const registerCustomerSchema = Joi.object({
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number().integer().allow(null).valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().allow(null).email().label('email'),
  birthDate: Joi.string().isoDate().label('birthDate'),
  passportNumber: Joi.string().label('passportNumber'),
  address: Joi.string().label('address'),
  password: Joi.string().required().min(8).label('password')
});

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

const changePasswordCustomerSchema = Joi.object({
  currentPassword: Joi.string().required().label('currentPassword'),
  newPassword: Joi.string().required().min(8).label('newPassword'),
  confirmPassword: Joi.string().required().label('confirmPassword')
});

const changeProfileCustomerSchema = Joi.object({
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  phone: Joi.string().regex(/^\d+$/).allow(null, '').label('phone'),
  gender: Joi.number().integer().allow(null).valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  birthDate: Joi.string().allow(null).isoDate().label('birthDate')
});

export {
  createCustomerWisereSchema,
  customerWisereIdSchema,
  loginSchema,
  loginSocialSchema,
  updateCustomerWisereSchema,
  registerCustomerSchema,
  emailSchema,
  changePasswordSchema,
  changePasswordCustomerSchema,
  changeProfileCustomerSchema
};
