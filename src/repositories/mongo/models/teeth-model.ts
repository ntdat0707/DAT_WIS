import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface ITeeth extends Document {
  toothNumber: number;
  type: string;
  toothNotationIds: [string];
  timestamp: Date;
}

const TeethSchema = new Schema({
  toothNumber: { type: Number, required: true },
  type: { type: String, enum: ['adult', 'kid'], default: 'adult', required: true },
  toothNotationIds: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  timestamp: { type: Date, default: Date.now }
});

//Model
const TeethModel = mongoose.model<ITeeth>('Teeth', TeethSchema, 'teeth');
export { TeethModel, ITeeth };
