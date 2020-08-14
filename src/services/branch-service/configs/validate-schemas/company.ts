import Joi from 'joi';

export enum BusinessType {
  DENTAL = 'DENTAL',
  SPA = 'SPA',
  BEAUTY_SALON = 'BEAUTY_SALON',
  NAIL_SALON = 'NAIL_SALON',
  BABER_SHOP = 'BABER_SHOP',
  MASSAGE = 'MASSAGE'
}

const initCompanySchema = Joi.object({
  businessName: Joi.string().required().label('businessName'),
  phone: Joi.string().required(),
  businessType: Joi.string()
    .valid(...Object.keys(BusinessType))
    .allow(null)
});

export { initCompanySchema };
