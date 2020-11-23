import Joi from 'joi';

const createDiagnosis = Joi.object({
  teethId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('teethId'),
  teethNumber: Joi.number().integer().label('teethNumber'),
  staffId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('staffId'),
  status: Joi.string().label('status'),
  // diagnosticPathIds: Joi.array()
  //   .min(1)
  //   .required()
  //   .items(
  //     Joi.string()
  //       .regex(/^[0-9a-fA-F]{24}$/)
  //       .label('diagnosticPathId')
  //   ),
  diagnosticIds: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .label('diagnosticId')
    ),
  treatmentId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('treatmentId'),
  diagnosticName: Joi.string().label('diagnosticName')
});

const updateDiagnosis = Joi.object({
  diagnosisId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .label('diagnosisId'),
  teethNumber: Joi.number().integer().label('teethNumber'),
  teethId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('teethId'),
  staffId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('staffId'),
  status: Joi.string().label('status'),
  // diagnosticPathIds: Joi.array()
  //   .min(1)
  //   .required()
  //   .items(
  //     Joi.string()
  //       .regex(/^[0-9a-fA-F]{24}$/)
  //       .label('diagnosticPathId')
  //   ),
  diagnosticIds: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .label('diagnosticId')
    ),
  diagnosticName: Joi.string().label('diagnosticName')
});

const getDiagnosis = Joi.object({
  customerId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('customerId'),
  treatmentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .label('treatmentId')
});
export { createDiagnosis, updateDiagnosis, getDiagnosis };
