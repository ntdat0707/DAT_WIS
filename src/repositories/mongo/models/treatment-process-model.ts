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
  createOn: Date;
  createdById: string;
  createdByName: string;
  procedureIds: [string];
  detailTreatment: string;
  //laboId:string;
}

const TreatmentProcessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locationId: { type: String, required: true },
  locationName: { type: String, required: true },
  staffId: { type: String, required: true },
  staffName: { type: String, required: true },
  processDescription: { type: String, required: false },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  note: { type: String, required: false },
  createOn: { type: Date, default: Date.now },
  createdById: { type: String, required: true },
  createdByName: { type: String, required: true },
  procedureIds: [{ type: Schema.Types.ObjectId, ref: 'Procedure' }],
  detailTreatment: { type: String, required: false }
  //laboId:{}
});

//Model
const TreatmentProcessModel = mongoose.model<ITreatmentProcess>(
  'TreatmentProcess',
  TreatmentProcessSchema,
  'treatment_process'
);
export { TreatmentProcessModel, ITreatmentProcess };
