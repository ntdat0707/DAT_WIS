import Joi from 'joi';
import { EPaymentType } from '../../../../utils/consts/index';
import { ESourceType } from '../../../../utils/consts';

const createInvoiceSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  appointmentId: Joi.string().guid({
    version: ['uuidv4']
  }),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('customerWisereId'),
  source: Joi.string()
    .valid(ESourceType.POS, ESourceType.WEBSITE, ESourceType.FACEBOOK, ESourceType.MARKETPLACE, ESourceType.OTHER)
    .allow(null, '')
    .label('source'),
  note: Joi.string().allow(null, '').label('note'),
  discount: Joi.number().integer().min(0).allow(null).label('discount'),
  tax: Joi.number().integer().min(0).allow(null).label('tax'),
  totalQuantity: Joi.number().integer().min(1).required().label('totalQuantity'),
  subtotal: Joi.number().integer().min(0).required().label('subtotal'),
  totalAmount: Joi.number().integer().min(0).required().label('totalAmount'),
  listInvoiceDetail: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        unit: Joi.string().allow(null, '').label('unit'),
        quantity: Joi.number().integer().min(1).required().label('quantity'),
        listStaff: Joi.array()
          .min(1)
          .required()
          .items(
            Joi.object({
              staffId: Joi.string()
                .guid({
                  version: ['uuidv4']
                })
                .required()
                .label('staffId')
            })
          )
          .label('listStaff')
      })
    )
    .label('listInvoiceDetail')
});

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

export { createInvoiceSchema, createPaymentSchema };
