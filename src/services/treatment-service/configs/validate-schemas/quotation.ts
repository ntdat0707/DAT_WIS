import Joi from 'joi';
import { EQuotationDiscountType, EQuotationCurrencyUnit } from '../../../../utils/consts';

const createQuotationsDentalSchema = Joi.object({
  treatmentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('treatmentId'),
  locationId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('locationId'),
  accountedBy: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('accountedBy'),
  customerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('customerId'),
  note: Joi.string().max(150).allow(null, '').label('note'),
  discountType: Joi.string()
    .valid(...Object.values(EQuotationDiscountType))
    .label('discountType'),
  currencyUnit: Joi.string()
    .valid(...Object.values(EQuotationCurrencyUnit))
    .label('currentcyUnit')
});
export { createQuotationsDentalSchema };
