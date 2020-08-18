import Joi from 'joi';
import { EGender } from '../../../../utils/consts';

const createCustomerSchema = Joi.object({
  fullName: Joi.string().required().label('fullName'),
  gender: Joi.number().integer().allow(null).valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().allow(null).email().label('email'),
  birthDate: Joi.string().isoDate().label('birthDate'),
  passportNumber: Joi.string().label('passportNumber'),
  address: Joi.string().label('address')
});

const customerIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerId');

export { createCustomerSchema, customerIdSchema };
