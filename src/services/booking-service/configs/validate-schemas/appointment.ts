import Joi from 'joi';
// import { EAppointmentStatus } from '../../../../utils/consts';

const createAppointmentDetailSchema = Joi.object({
  serviceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('serviceId'),
  staffIds: Joi.array()
    .min(1)
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .required()
    )
    .label('staffIds'),

  resourceId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('resourceId'),
  startTime: Joi.string().isoDate().required().label('startTime')
});

const createAppointmentSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerId'),
  date: Joi.string().isoDate().required(),
  appointmentDetails: Joi.array().min(1).items(createAppointmentDetailSchema).label('appointmentDetails')
});

const filterAppointmentDetailChema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  startTime: Joi.string().isoDate(),
  endTime: Joi.string().isoDate()
});

export { createAppointmentDetailSchema, createAppointmentSchema, filterAppointmentDetailChema };
