import Joi from 'joi';
import { EGender, EStatusRole } from '../../../../utils/consts';

const staffIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('staffId');

export const createStaffSchema = Joi.object({
  // groupStaffId: Joi.string().required(),
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  email: Joi.string().allow(null, '').label('email'),
  gender: Joi.number().integer().required().valid(EGender.FEMALE, EGender.MALE, EGender.UNISEX).label('gender'),
  phone: Joi.string().regex(/^\d+$/).required().label('phone'),
  birthDate: Joi.string().isoDate(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
  color: Joi.string(),
  roleId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('roleId'),
  statusRole: Joi.string()
    .valid(...Object.values(EStatusRole))
    .label('statusRole'),
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
  isServiceProvider: Joi.boolean().required().label('isServiceProvider'),
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
  birthDate: Joi.string().isoDate(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
  color: Joi.string(),
  phone: Joi.string().regex(/^\d+$/).disallow('', null).label('phone'),
  isServiceProvider: Joi.boolean().required().label('isServiceProvider'),
  roleId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('roleId'),
  statusRole: Joi.string()
    .valid(...Object.values(EStatusRole))
    .label('statusRole'),
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
    .label('serviceIds'),
  teamId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .label('teamId')
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
  teamIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
    .label('teamIds'),
  searchValue: Joi.string(),
  isServiceProvider: Joi.boolean().label('isServiceProvider')
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
  staffId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('staffId')
});
const settingPositionStaffSchema = Joi.object({
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('locationId'),
  listPostionStaff: Joi.array()
    .required()
    .length(2)
    .items(
      Joi.object({
        staffId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('staffId'),
        index: Joi.number().integer().min(0).label('index')
      })
    )
    .label('listPostionStaff')
});
export {
  staffIdSchema,
  filterStaffSchema,
  getStaffMultipleService,
  getStaffAvailableTimeSlots,
  deleteStaffSchema,
  settingPositionStaffSchema
};
