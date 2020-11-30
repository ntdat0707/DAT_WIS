import Joi from 'joi';

const createMedicalDocumentFileSchema = Joi.object({
  name: Joi.string().required().label('name'),
  medicalDocumentId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('medicalDocumentId')
});

const medicalDocumentIdSchema = Joi.string()
  .required()
  .regex(/^[0-9a-fA-F]{24}$/)
  .label('medicalDocumentId');

const medicalFileIDSchema = Joi.string()
  .required()
  .regex(/^[0-9a-fA-F]{24}$/)
  .label('medicalFileId');
export { createMedicalDocumentFileSchema, medicalDocumentIdSchema, medicalFileIDSchema };
