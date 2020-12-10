import Joi from 'joi';
import { EAppointmentStatus, EAppointmentBookingSource } from '../../../../utils/consts';

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
  startTime: Joi.string().isoDate().required().label('startTime'),
  duration: Joi.number().integer().required().label('duration')
});

const createAppointmentSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerWisereId'),
  date: Joi.string().isoDate().required(),
  bookingSource: Joi.string().valid(EAppointmentBookingSource.SCHEDULED, EAppointmentBookingSource.WALK_IN).required(),
  appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails'),
  appointmentGroupId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('appointmentGroupId'),
  relatedAppointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('relatedAppointmentId'),
  note: Joi.string().allow('', null).label('note')
});

const customerCreateAppointmentSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  date: Joi.string().isoDate().required(),
  bookingSource: Joi.string().valid(EAppointmentBookingSource.MARKETPLACE).required(),
  appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails'),
  appointmentGroupId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('appointmentGroupId'),
  relatedAppointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('relatedAppointmentId')
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
    .label('staffIds'),
  resourceIds: Joi.array()
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .required()
    )
    .label('resourceIds')
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
    .valid(...Object.values(EAppointmentStatus))
    .label('status')
});

const appointmentCancelReasonSchema = Joi.string().required().max(1000).label('cancelReason');

const updateAppointmentSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerWisereId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  date: Joi.string().isoDate(),
  note: Joi.string().allow('', null).label('note'),
  createNewAppointmentDetails: Joi.array()
    .items(
      Joi.object({
        resourceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .label('resourceId'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        staffIds: Joi.array()
          .items(
            Joi.string()
              .guid({
                version: ['uuidv4']
              })
              .required()
          )
          .label('staffIds'),
        startTime: Joi.string().isoDate().required().label('startTime'),
        duration: Joi.number().integer().required().label('duration')
      })
    )
    .label('createNewAppointmentDetails'),
  updateAppointmentDetails: Joi.array()
    .items(
      Joi.object({
        appointmentDetailId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('appointmentDetailId'),
        resourceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .label('resourceId'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('resourceId'),
        staffIds: Joi.array()
          .items(
            Joi.string()
              .guid({
                version: ['uuidv4']
              })
              .required()
          )
          .label('staffIds'),
        startTime: Joi.string().isoDate().required().label('startTime'),
        duration: Joi.number().integer().required().label('duration')
      })
    )
    .label('updateAppointmentDetails'),
  deleteAppointmentDetails: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('deleteAppointmentDetails'),
  createNewAppointments: Joi.array()
    .items(
      Joi.object({
        customerWisereId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .label('customerWisereId'),
        appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails')
      })
    )
    .label('createNewAppointments')
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
  startTime: Joi.string().isoDate().required().label('startTime'),
  duration: Joi.number().integer().required().label('duration')
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
  startTime: Joi.string().isoDate().required().label('startTime'),
  duration: Joi.number().integer().required().label('duration')
});
const appointmentDetailIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('appointmentDetailId');

const createAppointmentInGroupSchema = Joi.object({
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerWisereId'),
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
  bookingSource: Joi.string().valid(EAppointmentBookingSource.SCHEDULED, EAppointmentBookingSource.WALK_IN),
  appointments: Joi.array().min(2).max(50).items(createAppointmentInGroupSchema).label('appointments')
});
const appointmentGroupIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('appointmentGroupIdSchema');

const updateAppointmentInGroupSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  customerWisereId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerWisereId'),
  appointmentDetails: Joi.array().min(1).max(100).items(createAppointmentDetailSchema).label('appointmentDetails'),
  isPrimary: Joi.bool().required().label('isPrimary')
});
const updateAppointmentGroupSchema = Joi.object({
  appointmentGroupId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentGroupId'),
  date: Joi.string().isoDate(),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  createNewAppointments: Joi.array().max(50).items(createAppointmentInGroupSchema).label('createNewAppointments'),
  updateAppointments: Joi.array().max(50).items(updateAppointmentInGroupSchema).label('updateAppointments'),
  deleteAppointments: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('deleteAppointments'),
  bookingSource: Joi.string().valid(EAppointmentBookingSource.SCHEDULED, EAppointmentBookingSource.WALK_IN)
});

const appointmentCancelSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  cancelReason: Joi.string().required().max(1000).label('cancelReason')
});

const appointmentRescheduleSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  startTime: Joi.string().isoDate().required().label('startTime')
});

const ratingAppointmentSchema = Joi.object({
  appointmentId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentId'),
  numberRating: Joi.number().integer().min(0).max(5).required().label('numberRating'),
  contentReview: Joi.string().required().label('contentReview')
});

const updateAppointmentStatusDetailSchema = Joi.object({
  appointmentDetailId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('appointmentDetailId'),
  status: Joi.string()
    .required()
    .valid(
      EAppointmentStatus.NEW,
      EAppointmentStatus.CONFIRMED,
      EAppointmentStatus.IN_SERVICE,
      EAppointmentStatus.ARRIVED,
      EAppointmentStatus.COMPLETED,
      EAppointmentStatus.CANCEL,
      EAppointmentStatus.NO_SHOW
    )
    .label('status')
});
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
  appointmentGroupIdSchema,
  customerCreateAppointmentSchema,
  updateAppointmentGroupSchema,
  appointmentCancelSchema,
  appointmentRescheduleSchema,
  ratingAppointmentSchema,
  updateAppointmentStatusDetailSchema
};
