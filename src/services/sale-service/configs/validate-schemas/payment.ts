import Joi from 'joi';
import { EPaymentMethodType } from '../../../../utils/consts';
const createPaymentSchema = Joi.object({
  invoiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('invoiceId'),
  paymentMethods: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        paymentMethodId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('paymentMethodId'),
        amount: Joi.number().integer().min(1).required().label('amount'),
        provider: Joi.object({
          name: Joi.string().required().label('name'),
          accountNumber: Joi.number().integer().required().label('accountNumber')
        })
          .allow(null)
          .label('provider')
      })
    )
    .label('paymentMethods')
});

const createPaymentMethodSchema = Joi.object({
  paymentType: Joi.string()
    .required()
    .valid(EPaymentMethodType.CASH, EPaymentMethodType.CARD, EPaymentMethodType.WALLET, EPaymentMethodType.OTHER)
    .label('name'),
  companyId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('companyId')
});

const updatePaymentMethodSchema = Joi.object({
  paymentMethodId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('paymentMethodId'),
  paymentType: Joi.string()
    .required()
    .valid(EPaymentMethodType.CASH, EPaymentMethodType.CARD, EPaymentMethodType.WALLET, EPaymentMethodType.OTHER)
    .label('name')
});

const deletePaymentMethodSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('paymentMethodId');
export { createPaymentSchema, createPaymentMethodSchema, updatePaymentMethodSchema, deletePaymentMethodSchema };
