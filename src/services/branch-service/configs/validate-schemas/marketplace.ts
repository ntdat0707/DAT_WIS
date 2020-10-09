import Joi from 'joi';
import {ETypeMarketPlaceField} from '../../../../utils/consts';

const createMarketplaceField = Joi.object({
	type: Joi.string()
		.valid(...Object.keys(ETypeMarketPlaceField))
		.required()
		.label('type'),
	name: Joi.string()
		.required()
		.label('name'),
	options: Joi.array()
		.items(Joi.string())
		.allow(null)
		.allow('')
		.label('options'),
});

const createMarketplaceValue = Joi.object({
	fieldId: Joi.string()
		.guid({
			version: ['uuidv4']
		})
		.required()
		.label('fieldId'),
	locationId: Joi.string()
		.guid({
			version: ['uuidv4']
		})
		.required()
		.label('locationId'),
	value: Joi.string().required().label('value'),
});
export { createMarketplaceField, createMarketplaceValue };
