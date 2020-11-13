import Joi from 'joi';
import { EPaymentMethodType, ETypeOfReceipt } from '../../../../utils/consts';
const createReceiptSchema = Joi.object({
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
          accountNumber: Joi.number().integer().max(2147483647).required().label('accountNumber')
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
  companyId: Joi.string().required().label('companyId')
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

const createNewReceiptSchema = Joi.object({
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerWisereId'),
  amount: Joi.number().integer().min(1).required().label('amount'),
  paymentMethodId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('paymentMethodId'),
  typeOfReceipt: Joi.string()
    .valid(...Object.values(ETypeOfReceipt))
    .required()
    .label('typeOfReceipt'),
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId'),
  dateReceived: Joi.string().isoDate().allow(null).label('dateReceived'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  description: Joi.string().allow(null, '').label('description')
});

const filterReceiptSchema = Joi.object({
  fromDate: Joi.string().isoDate().allow(null).label('fromDate'),
  toDate: Joi.string().isoDate().allow(null).label('toDate')
});

export {
  createReceiptSchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  deletePaymentMethodSchema,
  createNewReceiptSchema,
  filterReceiptSchema
};
