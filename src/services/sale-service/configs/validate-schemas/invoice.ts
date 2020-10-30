import Joi from 'joi';
import { EInvoiceSourceType } from '../../../../utils/consts';

const createInvoiceSchema = Joi.object({
  invoiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('invoiceId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('appointmentId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('customerWisereId'),
  source: Joi.string()
    .valid(
      EInvoiceSourceType.POS,
      EInvoiceSourceType.WEBSITE,
      EInvoiceSourceType.FACEBOOK,
      EInvoiceSourceType.MARKETPLACE,
      EInvoiceSourceType.OTHER
    )
    .allow(null, '')
    .label('source'),
  note: Joi.string().allow(null, '').label('note'),
  discountId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('discountId'),
  tax: Joi.number().integer().min(0).allow(null).label('tax'),
  totalQuantity: Joi.number().integer().min(1).required().label('totalQuantity'),
  subTotal: Joi.number().integer().min(0).required().label('subTotal'),
  totalAmount: Joi.number().integer().min(0).required().label('totalAmount'),
  balance: Joi.number().integer().min(0).required().label('balance'),
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
    .label('listInvoiceDetail'),
  listPayment: Joi.array()
    .allow(null)
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
    .label('listPayment')
});

const receiptIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('receiptId');

const customerWisereIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerWisereIdSchema');

const createInvoiceLogSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  listInvoices: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        appointmentId: Joi.string().guid({
          version: ['uuidv4']
        }),
        customerWisereId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .allow(null)
          .label('customerWisereId'),
        source: Joi.string()
          .valid(
            EInvoiceSourceType.POS,
            EInvoiceSourceType.WEBSITE,
            EInvoiceSourceType.FACEBOOK,
            EInvoiceSourceType.MARKETPLACE,
            EInvoiceSourceType.OTHER
          )
          .allow(null, '')
          .label('source'),
        note: Joi.string().allow(null, '').label('note'),
        discountId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .allow(null)
          .label('discountId'),
        tax: Joi.number().integer().min(0).allow(null).label('tax'),
        totalQuantity: Joi.number().integer().min(1).required().label('totalQuantity'),
        subTotal: Joi.number().integer().min(0).required().label('subTotal'),
        totalAmount: Joi.number().integer().min(0).required().label('totalAmount'),
        balance: Joi.number().integer().min(0).required().label('balance'),
        listInvoiceDetails: Joi.array()
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
          .label('listInvoiceDetails')
      })
    )
    .label('listInvoices')
});

const getListInvoicesLog = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId')
});
export { createInvoiceSchema, receiptIdSchema, customerWisereIdSchema, createInvoiceLogSchema, getListInvoicesLog };
