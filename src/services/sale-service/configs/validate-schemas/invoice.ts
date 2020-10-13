import Joi from 'joi';
const createInvoiceSchema = Joi.object({
  code: Joi.string().required().label('code'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('location_id'),

  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('appointment_id'),
  source: Joi.string().label('source'),
  note: Joi.string().label('note'),
  discount: Joi.number().integer().label('discount'),
  tax: Joi.number().integer().label('tax'),
  balance: Joi.number().label('balance'),
  status: Joi.string().label('status'),
  subTotal: Joi.number().integer().label('subTotal')
});

export { createInvoiceSchema };
