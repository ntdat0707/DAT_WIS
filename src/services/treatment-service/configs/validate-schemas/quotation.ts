import Joi from 'joi';
import { EQuotationDiscountType, EQuotationCurrencyUnit, EQuotationTeethType } from '../../../../utils/consts';
import { TEETH_2H, TEETH_ADULT, TEETH_CHILD } from '../consts';

const quotationsDentalDetailSchema = Joi.object({
  // _id: Joi.string()
  //   .regex(/^[0-9a-fA-F]{24}$/)
  //   .label('quotationDentalDetailId'),
  isAccept: Joi.boolean().required().label('isAccept'),
  serviceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('serviceId'),
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId'),
  teethNumbers: Joi.array()
    .items(Joi.string().valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD))
    .min(1)
    .required()
    .label('teeth'),
  discount: Joi.number().integer().min(0).required().allow(null, '').label('discount'),
  discountType: Joi.string()
    .valid(...Object.values(EQuotationDiscountType))
    .allow(null, '')
    .label('discountType'),
  tax: Joi.string().allow(null, '').label('tax'),
  currencyUnit: Joi.string()
    .valid(...Object.values(EQuotationCurrencyUnit))
    .label('currencyUnit'),
  teethType: Joi.string()
    .valid(...Object.values(EQuotationTeethType))
    .label('teethType')
});

const createQuotationsDentalSchema = Joi.object({
  treatmentId: Joi.string().required().label('treatmentId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  accountedBy: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('accountedBy'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  date: Joi.date().label('date'),
  expire: Joi.date().required().label('expire'),
  quotationsDetails: Joi.array().items(quotationsDentalDetailSchema).label('quotationsDentalDetails')
});

const updateQuotationsDentalSchema = Joi.object({
  expire: Joi.date().required().label('expire'),
  treatmentId: Joi.string().required().label('treatmentId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  date: Joi.date().label('date'),
  quotationsDetails: Joi.array().items(quotationsDentalDetailSchema).label('quotationsDentalDetails')
});

export { createQuotationsDentalSchema, updateQuotationsDentalSchema, quotationsDentalDetailSchema };