import Joi from 'joi';
import { EWeekDays, ELocationStatus } from '../../../../utils/consts';

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

export { createLocationSchema, locationIdSchema, createLocationWorkingTimeSchema, updateLocationSchema };
