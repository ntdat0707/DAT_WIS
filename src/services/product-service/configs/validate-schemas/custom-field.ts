import Joi from 'joi';

const uploadImageProductSchema1 = Joi.string().required().label('photo');

export { uploadImageProductSchema1 };
