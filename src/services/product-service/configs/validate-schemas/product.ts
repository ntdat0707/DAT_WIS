import Joi from 'joi';

const uploadImageProductSchema = Joi.string().required().label('photo');

export { uploadImageProductSchema };
