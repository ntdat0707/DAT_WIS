import Joi from 'joi';

const cityCodeSchema = Joi.string().required().label('cityCode');

const createCitySchema = Joi.object({
  name: Joi.string().required().label('name'),
  countryId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('countryId'),
  countryCode: Joi.string().required().label('countryCode')
});
export { cityCodeSchema, createCitySchema };
