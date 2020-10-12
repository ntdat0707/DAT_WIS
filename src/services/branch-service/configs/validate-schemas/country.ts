import Joi from 'joi';

const countryCodeSchema = Joi.string().required().label('countryCode');
export { countryCodeSchema };
