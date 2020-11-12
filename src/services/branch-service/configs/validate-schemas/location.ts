import Joi from 'joi';
import { EWeekDays, ELocationStatus, EPayment, EParkingStatus, EOrder, ESearchBy } from '../../../../utils/consts';

const createLocationSchema = Joi.object({
  name: Joi.string().required().label('name'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  email: Joi.string().email().label('email'),
  address: Joi.string().required().label('address'),
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
    .label('workingTimes'),
  description: Joi.string().label('description'),
  title: Joi.string().label('title'),
  payment: Joi.string().valid(EPayment.CASH, EPayment.CARD, EPayment.ALL).label('payment'),
  parking: Joi.string().valid(EParkingStatus.ACTIVE, EParkingStatus.INACTIVE).label('parking'),
  rating: Joi.number().label('rating'),
  recoveryRooms: Joi.number().label('recoveryRooms'),
  totalBookings: Joi.number().label('totalBookings'),
  openedAt: Joi.string().isoDate(),
  placeId: Joi.string().label('placeId'),
  fullAddress: Joi.string().label('fullAddress'),
  addressInfor: Joi.array().required().min(3).items(Joi.object().required()).label('addressInfor'),
  prefixCode: Joi.string().min(1).max(10).uppercase().required().label('prefixCode')
});

const locationIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('locationId');

const pathNameSchema = Joi.string().required().label('pathName');

const getLocationMarketPlace = Joi.object({
  pathName: Joi.string().required().label('pathName'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerId')
});

const getLocationMarketPlacebyId = Joi.object({
  locationId: Joi.string().uuid().required().label('pathName'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('customerId')
});

const companyIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('companyId');

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
  address: Joi.string().label('address'),
  latitude: Joi.number().label('latitude'),
  longitude: Joi.number().label('longitude'),
  description: Joi.string().label('description'),
  title: Joi.string().label('title'),
  deleteImages: Joi.array()
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .allow(null)
    )
    .label('deleteImages')
    .allow(null),

  // payment: Joi.string().valid(EPayment.CASH, EPayment.CARD, EPayment.ALL).label('payment'),
  // parking: Joi.string().valid(EParkingStatus.ACTIVE, EParkingStatus.INACTIVE).label('parking'),
  status: Joi.string().required().valid(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE).label('status'),
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
    .label('workingTimes'),
  placeId: Joi.string().label('placeId'),
  fullAddress: Joi.string().label('fullAddress'),
  addressInfor: Joi.array().items(Joi.object().required()).label('addressInfor'),
  prefixCode: Joi.string().min(1).max(10).uppercase().label('prefixCode')
});

const searchSchema = Joi.object({
  keywords: Joi.string().allow(null, '').label('keywords'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('customerId'),
  latitude: Joi.number().allow(null).label('latitude'),
  longitude: Joi.number().allow(null).label('longitude'),
  searchBy: Joi.string()
    .valid(...Object.values(ESearchBy))
    .allow(null, '')
    .label('searchBy'),
  order: Joi.string()
    .valid(EOrder.NEWEST, EOrder.NEWEST, EOrder.PRICE_LOWEST, EOrder.PRICE_HIGHEST)
    .allow(null)
    .label('order'),
  addressInfor: Joi.array().items(Joi.object().required()).allow(null, '').label('addressInfor')
});

const suggestedSchema = Joi.object({
  keywords: Joi.string().allow(null, '').label('keywords'),
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null)
    .label('customerId'),
  cityName: Joi.string().allow(null, '').label('cityName')
});

export {
  searchSchema,
  pathNameSchema,
  companyIdSchema,
  suggestedSchema,
  locationIdSchema,
  updateLocationSchema,
  createLocationSchema,
  getLocationMarketPlace,
  getLocationMarketPlacebyId,
  createLocationWorkingTimeSchema
};
