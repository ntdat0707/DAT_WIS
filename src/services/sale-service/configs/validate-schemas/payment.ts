import Joi from 'joi';
import { EPaymentType } from '../../../../utils/consts/index';
const createPaymentSchema = Joi.object({
  invoiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('invoiceId'),
  type: Joi.string()
    .valid(EPaymentType.CARD, EPaymentType.CASH, EPaymentType.GIFT_CARD, EPaymentType.TRANFER)
    .required()
    .label('type'),
  amount: Joi.number().integer().min(0).required().label('amount')
});
export { createPaymentSchema };
