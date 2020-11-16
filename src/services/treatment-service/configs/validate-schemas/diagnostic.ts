import Joi from 'joi';
import { ETeeth } from '../../../../utils/consts';

const ToothNotation = Joi.array()
  .min(1)
  .items(
    Joi.object({
      toothName: Joi.string().label('toothName'),
      toothImage: Joi.string().label('toothImage'),
      style: Joi.string().label('style')
    })
  );

const TeethInformation = Joi.array()
  .min(1)
  .items(
    Joi.object({
      toothNumber: Joi.number().label('toothNumber'),
      toothNotations: ToothNotation
    })
  );

const DiagnosticDetail = Joi.object({
  code: Joi.string().label('code'),
  name: Joi.string().label('name'),
  pathologicalImages: ToothNotation
});

const createDiagnostic = Joi.object({
  staffId: Joi.array()
    .min(1)
    .required()
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .label('staffId'),
  customerId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .label('customerId'),
  type: Joi.string().valid(ETeeth.ADULT, ETeeth.KID),
  teeth: TeethInformation,
  diagnostics: Joi.array().min(1).items(DiagnosticDetail)
});

export { createDiagnostic };
