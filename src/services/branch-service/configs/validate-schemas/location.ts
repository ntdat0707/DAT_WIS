import Joi from 'joi';
import { EWeekDays, ELocationStatus, EPayment, EParkingStatus } from '../../../../utils/consts';

const createLocationSchema = Joi.object({
  name: Joi.string().required().label('name'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().email().label('email'),
  city: Joi.string().label('city'),
  district: Joi.string().label('district'),
  ward: Joi.string().label('ward'),
  address: Joi.string().label('address'),
  latitude: Joi.number().label('latitude'),
  longitude: Joi.number().label('longitude'),
  workingTimes: Joi.array()
    .length(7)
    .unique()
    .items(
      Joi.object({
        day: Joi.string()
          .required()
          .label('day')
          .valid(
            EWeekDays.MONDAY,
            EWeekDays.TUESDAY,
            EWeekDays.WEDNESDAY,
            EWeekDays.THURSDAY,
            EWeekDays.FRIDAY,
            EWeekDays.SATURDAY,
            EWeekDays.SUNDAY
          ),
        enabled: Joi.boolean().required().label('enabled'),
        range: Joi.array()
          .length(2)
          .items(
            Joi.string()
              .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/)
              .length(5)
          )
          .required()
          .label('range')
      })
    )
    .label('workingTimes')
});

const locationIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('locationId');

const companyIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('companyId');

const createLocationDetailSchema = Joi.object({
  title: Joi.string().label('title'),
  payment: Joi.string().valid(EPayment.CASH, EPayment.CARD, EPayment.ALL).label('payment'),
  parking: Joi.string().valid(EParkingStatus.ACTIVE, EParkingStatus.INACTIVE).label('parking'),
  gender:Joi.number().label('gender'),
  rating: Joi.number().label('rating'),
  recoveryRooms: Joi.number().label('recoveryRooms'),
  totalBookings : Joi.number().label('totalBookings'),
  openedAt: Joi.string().isoDate(),
});
const createLocationWorkingTimeSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  workingTimes: Joi.array()
    .length(7)
    .required()
    .unique()
    .items(
      Joi.object({
        day: Joi.string()
          .required()
          .label('day')
          .valid(
            EWeekDays.MONDAY,
            EWeekDays.TUESDAY,
            EWeekDays.WEDNESDAY,
            EWeekDays.THURSDAY,
            EWeekDays.FRIDAY,
            EWeekDays.SATURDAY,
            EWeekDays.SUNDAY
          ),
        enabled: Joi.boolean().required().label('enabled'),
        range: Joi.array()
          .length(2)
          .items(
            Joi.string()
              .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/)
              .length(5)
          )
          .required()
          .label('range')
      })
    )
    .label('workingTimes')
});

const updateLocationSchema = Joi.object({
  name: Joi.string().disallow('', null).label('name'),
  phone: Joi.string().regex(/^\d+$/).disallow('', null).label('phone'),
  email: Joi.string().email().label('email'),
  city: Joi.string().label('city'),
  district: Joi.string().label('district'),
  ward: Joi.string().label('ward'),
  address: Joi.string().label('address'),
  latitude: Joi.number().label('latitude'),
  longitude: Joi.number().label('longitude'),
  title: Joi.string().label('title'),
  payment: Joi.string().valid(EPayment.CASH, EPayment.CARD, EPayment.ALL).label('payment'),
  parking: Joi.string().valid(EParkingStatus.ACTIVE, EParkingStatus.INACTIVE).label('parking'),
  status: Joi.string().required().label('status').valid(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE),
  workingTimes: Joi.array()
    .length(7)
    .unique()
    .items(
      Joi.object({
        day: Joi.string()
          .required()
          .label('day')
          .valid(
            EWeekDays.MONDAY,
            EWeekDays.TUESDAY,
            EWeekDays.WEDNESDAY,
            EWeekDays.THURSDAY,
            EWeekDays.FRIDAY,
            EWeekDays.SATURDAY,
            EWeekDays.SUNDAY
          ),
        enabled: Joi.boolean().required().label('enabled'),
        range: Joi.array()
          .length(2)
          .items(
            Joi.string()
              .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/)
              .length(5)
          )
          .required()
          .label('range')
      })
    )
    .label('workingTimes')
});

const filterNearestSchema = Joi.object({
  latitude: Joi.number().required().label('latitude'),
  longitude: Joi.number().required().label('longitude')
});

export {
  createLocationSchema,
  locationIdSchema,
  createLocationWorkingTimeSchema,
  updateLocationSchema,
  filterNearestSchema,
  companyIdSchema,
  createLocationDetailSchema
};
