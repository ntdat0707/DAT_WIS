import Joi from 'joi';
import { BusinessType } from '../../../../utils/consts';

const initCompanySchema = Joi.object({
  businessName: Joi.string().required().label('businessName'),
  phone: Joi.string().required(),
  businessType: Joi.string()
    .valid(...Object.keys(BusinessType))
    .allow(null)
});

export { initCompanySchema };
