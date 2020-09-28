import Joi from 'joi';
import { EAppointmentStatus, AppointmentBookingSource } from '../../../../utils/consts';

const createRecentBookingSchema = Joi.object({
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
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId'),
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  locationId: Joi.string().guid({
    version: ['uuidv4']
  })
    .required()
    .label('locationId'),
});
export { createRecentBookingSchema };