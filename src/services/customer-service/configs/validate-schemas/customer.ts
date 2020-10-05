import Joi from 'joi';
import { EGender, ESocialType } from '../../../../utils/consts';

const createCustomerWisereSchema = Joi.object({
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number().integer().allow(null).valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().allow(null).email().label('email'),
  birthDate: Joi.string().isoDate().label('birthDate'),
  passportNumber: Joi.string().label('passportNumber'),
  address: Joi.string().label('address'),
  source: Joi.string().label('source'),
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
        type: Joi.string().required()
      })
    )
    .label('moreEmailContact'),
  morePhoneContact: Joi.array()
    .items(
      Joi.object({
        phone: Joi.string().regex(/^\d+$/).required().label('phone'),
        type: Joi.string().required()
      })
    )
    .label('morePhoneContact')
});

const updateCustomerWisereSchema = Joi.object({
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number().integer().required().valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  birthDate: Joi.string().isoDate().label('birthDate'),
  passportNumber: Joi.string().label('passportNumber'),
  address: Joi.string().label('address')
});

const customerWireseIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerId');

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

export {
  createCustomerWisereSchema,
  customerWireseIdSchema,
  loginSchema,
  loginSocialSchema,
  updateCustomerWisereSchema,
  registerCustomerSchema
};
