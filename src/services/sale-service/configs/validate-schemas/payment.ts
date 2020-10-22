import Joi from 'joi';
const createPaymentSchema = Joi.object({
  invoiceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('invoiceId'),
  paymentMethods: Joi.array()
    .min(0)
    .required()
    .items(
      Joi.object({
        paymentMethodId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('paymentMethodId'),
        amount: Joi.number().integer().required().label('amount'),
        provider: Joi.object({
          name: Joi.string().required().label('name'),
          accountNumber: Joi.number().integer().required().label('accountNumber')
        })
          .allow(null)
          .label('provider')
      })
    )
});
const createPaymentMethodSchema = Joi.string().required().label('name');
export { createPaymentSchema, createPaymentMethodSchema };
