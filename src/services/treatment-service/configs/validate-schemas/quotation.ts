import Joi from 'joi';
import { EQuotationDiscountType, EQuotationCurrencyUnit } from '../../../../utils/consts';
import { TEETH_2H, TEETH_ADULT, TEETH_CHILD } from '../consts';

const quotationsDentalDetailSchema = Joi.object({
  _id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('quotationDentalDetailId'),
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
  teeth: Joi.array()
    .items(Joi.string().valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD))
    .min(1)
    .required()
    .label('teeth'),
  discount: Joi.number().integer().min(0).required().allow(null, '').label('discount'),
  discountType: Joi.string()
    .valid(...Object.values(EQuotationDiscountType))
    .allow(null, '')
    .label('discountType'),
  quantity: Joi.number().integer().allow(null, '').label('quantity'),
  tax: Joi.string().allow(null, '').label('tax'),
  currencyUnit: Joi.string()
    .valid(...Object.values(EQuotationCurrencyUnit))
    .label('currencyUnit')
});

const createQuotationsDentalSchema = Joi.object({
  treatmentId: Joi.string()
    .required()
    .label('treatmentId'),
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
  discountType: Joi.string()
    .valid(...Object.values(EQuotationDiscountType))
    .label('discountType'),
  currencyUnit: Joi.string()
    .valid(...Object.values(EQuotationCurrencyUnit))
    .label('currentcyUnit'),
  quotationsDentalDetails: Joi.array()
    .items(quotationsDentalDetailSchema)
    .label('quotationsDentalDetails'),
});

export { createQuotationsDentalSchema, quotationsDentalDetailSchema };
