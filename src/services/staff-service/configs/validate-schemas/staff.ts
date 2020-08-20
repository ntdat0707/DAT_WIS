import Joi from 'joi';

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
  gender: Joi.number().required(),
  phone: Joi.string().required(),
  birthDate: Joi.string().isoDate().required(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
  mainLocationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('mainLocationId'),
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
    .label('workingLocationIds')
});
export const updateStaffSchema = Joi.object({
  // groupStaffId: Joi.string().required(),
  firstName: Joi.string().required().label('firstName'),
  lastName: Joi.string().required().label('lastName'),
  gender: Joi.number().required(),
  birthDate: Joi.string().isoDate().required(),
  passportNumber: Joi.string().required(),
  address: Joi.string(),
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
    .required()
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
    )
});

export const createStaffsSchema = Joi.object({
  mainLocationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('mainLocationId'),
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

export { staffIdSchema, filterStaffSchema };
