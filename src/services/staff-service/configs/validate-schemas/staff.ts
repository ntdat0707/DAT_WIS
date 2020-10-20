import Joi from 'joi';
import { EGender } from '../../../../utils/consts';

const staffIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('staffId');

export const createStaffSchema = Joi.object({
  // groupStaffId: Joi.string().required(),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('locationId'),
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  email: Joi.string().allow(null, '').label('email'),
  gender: Joi.number().integer().required().valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  birthDate: Joi.string().isoDate(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
  color: Joi.string(),
  workingLocationIds: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .required()
    )
    .label('workingLocationIds'),
  serviceIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('serviceIds')
});
export const updateStaffSchema = Joi.object({
  // groupStaffId: Joi.string().required(),
  isAllowedMarketPlace: Joi.boolean().required().label('isAllowedMarketPlace'),
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number().integer().required().valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  birthDate: Joi.string().isoDate().required(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
  color: Joi.string(),
  phone: Joi.string().regex(/^\d+$/).disallow('', null).label('phone'),
  workingLocationIds: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.string()
        .guid({
          version: ['uuidv4']
        })
        .required()
    )
    .label('workingLocationIds'),
  serviceIds: Joi.array()
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('serviceIds')
});

const filterStaffSchema = Joi.object({
  workingLocationIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    ),
  serviceIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    ),
  groupStaffIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    ),
  searchValue: Joi.string()
});

export const createStaffsSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('locationId'),
  staffDetails: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        firstName: Joi.string().required().label('firstName'),
        lastName: Joi.string().required().label('lastName'),
        email: Joi.string().email().label('email')
      })
    )
    .label('staffDetails')
});

const getStaffMultipleService = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  serviceIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('serviceIds')
});

const getStaffAvailableTimeSlots = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required(),
  workDay: Joi.string().required().label('workDay')
});

const deleteStaffSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId')
});

export { staffIdSchema, filterStaffSchema, getStaffMultipleService, getStaffAvailableTimeSlots, deleteStaffSchema };
