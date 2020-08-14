import Joi from 'joi';
import { EWeekDays } from '../../../../utils/consts';

const createLocationSchema = Joi.object({
  name: Joi.string().required().label('name'),
  phone: Joi.string().required().label('phone'),
  email: Joi.string().email().label('email'),
  city: Joi.string().label('city'),
  district: Joi.string().label('district'),
  ward: Joi.string().label('ward'),
  address: Joi.string().label('address'),
  latitude: Joi.number().label('latitude'),
  longitude: Joi.number().label('longitude')
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

export { createLocationSchema, locationIdSchema, createLocationWorkingTimeSchema };
