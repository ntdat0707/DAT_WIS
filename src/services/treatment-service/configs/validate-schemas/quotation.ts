import Joi from 'joi';
import { values } from 'lodash';
import { EQuotationDiscountType, EQuotationCurrencyUnit, ETeeth, EStatusQuotation } from '../../../../utils/consts';
import { TEETH_2H, TEETH_ADULT, TEETH_CHILD } from '../consts';

const quotationsDentalDetailSchema = Joi.object({
  _id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
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
  teethNumbers: Joi.array()
    .items(Joi.string().valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD))
    .min(1)
    .required()
    .label('teeth'),
  teethType: Joi.string()
    .valid(...Object.values(ETeeth))
    .required()
    .label('teethType'),
  discount: Joi.number().integer().min(0).allow(null, '').label('discount'),
  discountType: Joi.string()
    .valid(...Object.values(EQuotationDiscountType))
    .allow(null, '')
    .label('discountType'),
  tax: Joi.string().allow(null, '').label('tax'),
  currencyUnit: Joi.string()
    .valid(...Object.values(EQuotationCurrencyUnit))
    .label('currencyUnit')
});

const createQuotationsDentalSchema = Joi.object({
  treatmentId: Joi.string().label('treatmentId'),
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
  expire: Joi.date().label('expire'),
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

const quotationDentalIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .label('quotationDentalSchema');

const filterQuotationSchema = Joi.object({
  fromDate: Joi.string().isoDate().allow(null).label('fromDate'),
  toDate: Joi.string().isoDate().allow(null).label('toDate'),
  status: Joi.array()
    .items(Joi.string().valid(...Object(values(EStatusQuotation))))
    .allow(null)
    .label('status'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('locationId')
});
export {
  createQuotationsDentalSchema,
  updateQuotationsDentalSchema,
  quotationsDentalDetailSchema,
  quotationDentalIdSchema,
  filterQuotationSchema
};
