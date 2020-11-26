import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';
// import { EStatusTreatment } from '../../../utils/consts';

interface ITreatmentProcess extends Document {
  name: string;
  locationId: string;
  prescriptionId: string;
  treatmentId: string;
  note: string;
  createOn: Date;
  createdById: string;
  procedureIds: [string];
  //laboId:string;
}

const TreatmentProcessSchema = new Schema({
  name: { type: String, required: true },
  locationId: { type: String, required: true },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  note: { type: String, required: false },
  createOn: { type: Date, default: Date.now },
  createdById: { type: String, required: true },
  procedureIds: [{ type: Schema.Types.ObjectId, ref: 'Procedure' }]
  //laboId:{}
});

//Model
const TreatmentProcessModel = mongoose.model<ITreatmentProcess>(
  'TreatmentProcess',
  TreatmentProcessSchema,
  'treatment_process'
);
export { TreatmentProcessModel, ITreatmentProcess };
