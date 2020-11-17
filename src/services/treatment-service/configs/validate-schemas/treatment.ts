import Joi from 'joi';

const languageSchema = Joi.string().valid('en', 'vi').required().label('language');

const customerWisereIdSchema = Joi.string()
  .guid({
    version: ['uuidv4']
  })
  .required()
  .label('customerWisereId');

const updateMedicalHistorySchema = Joi.object({
  medicalHistories: Joi.array()
    .items(
      Joi.object({
        medicalHistoryId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('medicalHistoryId'),
        note: Joi.string().max(150).allow(null, '').label('note')
      })
    )
    .label('medicalHistories')
});

const createTreatmentSchema = Joi.object({
  treatments: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        teethId: Joi.array().items(Joi.string()).required().label('teethId'),
        serviceId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('serviceId'),
        staffId: Joi.string()
          .guid({
            version: ['uuidv4']
          })
          .required()
          .label('staffId'),
        procedureId: Joi.string().required().label('procedureId'),
        status: Joi.string().valid('Planned', 'Completed').required().label('status'),
        diagnoseId: Joi.string().required().label('diagnoseId'),
        note: Joi.string().allow(null, '').label('note'),
        startDate: Joi.string().isoDate().allow(null).label('startDate'),
        endDate: Joi.string().isoDate().allow(null).label('endDate'),
        prescription: Joi.array()
          .allow(null)
          .items(
            Joi.object({
              medicineId: Joi.string()
                .guid({
                  version: ['uuidv4']
                })
                .required()
                .label('medicineId'),
              quantity: Joi.number().integer().required().label('quantity'),
              noteMedicine: Joi.string().allow(null, '').label('noteMedicine'),
              notePrescription: Joi.string().allow(null, '').label('notePrescription')
            })
          )
      })
    )
    .label('treatments')
});
export { languageSchema, customerWisereIdSchema, updateMedicalHistorySchema, createTreatmentSchema };
