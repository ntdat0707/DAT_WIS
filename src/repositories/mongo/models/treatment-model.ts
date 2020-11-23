import mongoose, { Schema } from 'mongoose';
import { EStatusTreatment } from '../../../utils/consts';

interface ITreatment extends mongoose.Document {
  name: string;
  code: string;
  createDate: Date;
  status: string;
  customerId: string;
  creatorId: string;
  diagnosisIds: [string];
  procedureIds: [string];
  treatmentProcessIds: [string];
}

const TreatmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  createDate: { type: Date, default: Date.now },
  status: { type: String, enum: Object.values(EStatusTreatment), required: true },
  customerId: { type: String, required: true },
  creatorId: { type: String, required: true },
  diagnosisIds: [{ type: Schema.Types.ObjectId, ref: 'Diagnosis' }],
  procedureIds: [{ type: Schema.Types.ObjectId, ref: 'Procedure' }],
  treatmentProcessIds: [{ type: Schema.Types.ObjectId, ref: 'TreatmentProcess' }]
});

//Model
const TreatmentModel = mongoose.model<ITreatment>('Treatment', TreatmentSchema, 'treatment');
export { TreatmentModel, ITreatment };
