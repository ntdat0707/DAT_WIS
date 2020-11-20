import mongoose from 'mongoose';
import { EStatusTreatment } from '../../../utils/consts';

interface ITreatment extends mongoose.Document {
  name: string;
  createDate: Date;
  status: string;
  customerId: string;
  creatorId: string;
}

const TreatmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createDate: { type: Date, default: Date.now },
  status: { type: String, enum: Object.values(EStatusTreatment), required: true },
  customerId: { type: String, required: true },
  creatorId: { type: String, required: true }
});

//Model
const TreatmentModel = mongoose.model<ITreatment>('Treatment', TreatmentSchema, 'treatment');
export { TreatmentModel, ITreatment };
