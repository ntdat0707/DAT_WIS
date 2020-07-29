import Joi from 'joi';

const staffIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('staffId');

export const createStaffSchema = Joi.object({
  // groupStaffId: Joi.string().required(),
  fullName: Joi.string().required(),
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

const filterStaffSchema = Joi.object({
  locationId: Joi.string().guid({
    version: ['uuidv4']
  }),
  serviceIds: Joi.array()
    .min(1)
    .items(
      Joi.string().guid({
        version: ['uuidv4']
      })
    )
});
export { staffIdSchema, filterStaffSchema };
