import Joi from 'joi';

const createMarketplaceField = Joi.object({
	type: Joi.string().required().label('type'),
	name: Joi.string().required().label('name'),
	options: Joi.array().items(Joi.string()).min(1).required().label('options'),
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
