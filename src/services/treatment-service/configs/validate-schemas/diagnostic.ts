import Joi from 'joi';

// const ToothNotation = Joi.array()
//   .min(1)
//   .items(
//     Joi.object({
//       toothName: Joi.string().label('toothName'),
//       toothImage: Joi.string().label('toothImage'),
//       style: Joi.string().label('style')
//     })
//   );

// const TeethInformation = Joi.array()
//   .min(1)
//   .items(
//     Joi.object({
//       toothNumber: Joi.number().label('toothNumber'),
//       toothNotations: ToothNotation
//     })
//   );

// const Diagnostic = Joi.array().items(
//   Joi.object({
//     code: Joi.string().label('code'),
//     name: Joi.string().required().label('name'),
//     color: Joi.string().label('color'),
//     colorText: Joi.string().label('colorText'),
//     pathologicalTeethId: Joi.array()
//       .min(1)
//       .required()
//       .items(Joi.string().guid({ version: ['uuidv4'] }))
//       .label('pathologicalTeethId'),
//     diagnosticSub: Joi.array().items(Joi.link('#Diagnostic'))
//   })
// );

// const createDiagnostic = {
//   teethNumber: Joi.number().required().label('teethNumber'),
//   teethId: JoiOid.objectId().label('teethId'),
//   staffId: Joi.string()
//     .guid({ version: ['uuidv4'] })
//     .required()
//     .label('staffId'),
//   diagnosticDetailId: JoiOid.objectId().required().label('diagnosticDetailId')
// };

const createDiagnosticDetail = Joi.array()
  .required()
  .items(
    Joi.object({
      code: Joi.string().label('code'),
      name: Joi.string().required().label('name'),
      color: Joi.string().label('color'),
      colorText: Joi.string().label('colorText'),
      pathologicalTeethId: Joi.array()
        .min(1)
        .required()
        .items(Joi.string().guid({ version: ['uuidv4'] }))
        .label('pathologicalTeethId'),
      diagnosticSub: Joi.array().items(Joi.link('#Diagnostic'))
    })
  );

export { createDiagnosticDetail };
