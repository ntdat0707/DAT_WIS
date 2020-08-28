import Joi from 'joi';
import { EAppointmentStatus } from '../../../../utils/consts';

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
  appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails')
});

const filterAppointmentDetailChema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  startTime: Joi.string().isoDate(),
  endTime: Joi.string().isoDate(),
  staffIds: Joi.array()
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .required()
    )
    .label('staffIds')
});

const appointmentIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('appointmentId');

const updateAppointmentStatusSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  status: Joi.string()
    .required()
    .valid(
      EAppointmentStatus.NEW,
      EAppointmentStatus.CONFIRMED,
      EAppointmentStatus.CONFIRMED,
      EAppointmentStatus.IN_SERVICE,
      EAppointmentStatus.ARRIVED,
      EAppointmentStatus.COMPLETED,
      EAppointmentStatus.CANCEL,
      EAppointmentStatus.NO_SHOW
    )
    .label('status')
});

const appointmentCancelReasonSchema = Joi.string().required().max(1000).label('cancelReason');

const updateAppointmentSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required(),
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
  date: Joi.string().isoDate().required()
});
const createAppointmentDetailFullSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
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
    .label('resourceId'),
  startTime: Joi.string().isoDate().required().label('startTime')
});

const updateAppointmentDetailSchema = Joi.object({
  appointmentDetailId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
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
    .label('resourceId'),
  startTime: Joi.string().isoDate().required().label('startTime')
});
const appointmentDetailIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('appointmentDetailId');

const createAppointmentInGroupSchema = Joi.object({
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerId'),
  appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails'),
  isPrimary: Joi.bool().required().label('isPrimary')
});
const createAppointmentGroupSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  appointments: Joi.array().min(1).max(50).items(createAppointmentInGroupSchema).label('appointments')
});
const appointmentGroupIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('appointmentGroupIdSchema');
export {
  createAppointmentDetailSchema,
  createAppointmentSchema,
  filterAppointmentDetailChema,
  appointmentIdSchema,
  updateAppointmentStatusSchema,
  appointmentCancelReasonSchema,
  updateAppointmentSchema,
  createAppointmentDetailFullSchema,
  updateAppointmentDetailSchema,
  appointmentDetailIdSchema,
  createAppointmentGroupSchema,
  appointmentGroupIdSchema
};
