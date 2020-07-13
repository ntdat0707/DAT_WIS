import Joi from '@hapi/joi';

const staffIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('staffId');

export const createStaffSchema = Joi.object({
  groupStaffId: Joi.string().required(),
  fullName: Joi.string().required(),
  gender: Joi.number().required(),
  phone: Joi.string().required(),
  birthDate: Joi.string()
    .isoDate()
    .required(),
  passportNumber: Joi.string().required(),
  address: Joi.string()
});
export { staffIdSchema };
