import Joi from 'joi';
import { TEETH_2H, TEETH_ADULT, TEETH_CHILD } from '../consts';

const createDiagnosis = Joi.object({
  teethNumber: Joi.string()
    .required()
    .valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD)
    .label('teethNumber'),
  staffId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('staffId'),
  diagnosticId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('diagnosticId'),
  treatmentId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('treatmentId'),
  diagnosticName: Joi.string().label('diagnosticName')
});

const deleteDiagnosis = Joi.string()
  .required()
  .regex(/^[0-9a-fA-F]{24}$/)
  .label('diagnosisId');

const teethNumberSchema = Joi.string()
  .required()
  .valid(TEETH_2H, ...TEETH_ADULT, ...TEETH_CHILD)
  .label('teethNumber');
export { createDiagnosis, deleteDiagnosis, teethNumberSchema };
