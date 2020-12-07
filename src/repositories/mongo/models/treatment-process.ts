import mongoose, { Schema } from 'mongoose';

interface ITreatmentProcess extends mongoose.Document {
  name: string;
  locationId: string;
  locationName: string;
  staffId: string;
  staffName: string;
  processDescription: string;
  prescriptionId: string;
  treatmentId: string;
  note: string;
  createDate: Date;
  creatorId: string;
  creatorName: string;
}

const TreatmentProcessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locationId: { type: String, required: true },
  locationName: { type: String, required: true },
  staffId: { type: String, required: true },
  staffName: { type: String, required: true },
  processDescription: { type: String, required: true },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true }
});

//Model
const TreatmentProcessModel = mongoose.model<ITreatmentProcess>(
  'TreatmentProcess',
  TreatmentProcessSchema,
  'treatmentProcess'
);
export { TreatmentProcessModel, ITreatmentProcess };
