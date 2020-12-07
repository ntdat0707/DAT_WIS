import mongoose, { Schema } from 'mongoose';

interface ITreatmentProcess extends mongoose.Document {
  name: string;
  locationId: string;
  prescriptionId: string;
  treatmentId: string;
  note: string;
  createOn: Date;
  createdById: string;
  procedures: [object];
  laboId: string;
}

const TreatmentProcessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locationId: { type: String, required: true },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  note: { type: String, required: false },
  createOn: { type: Date, default: Date.now },
  createdById: { type: String, required: true },
  procedures: [
    {
      procedureId: { type: Schema.Types.ObjectId, ref: 'Procedure' },
      assistantId: { type: String, required: false },
      detailTreatment: { type: String, required: true }
    }
  ],
  laboId: { type: Schema.Types.ObjectId, ref: 'Labo' }
});

//Model
const TreatmentProcessModel = mongoose.model<ITreatmentProcess>(
  'TreatmentProcess',
  TreatmentProcessSchema,
  'treatment_process'
);
export { TreatmentProcessModel, ITreatmentProcess };
