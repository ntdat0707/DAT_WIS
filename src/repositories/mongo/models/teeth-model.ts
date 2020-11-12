import mongoose from 'mongoose';
import { IToothNotation } from './tooth-notation-model';

interface ITeeth extends mongoose.Document {
  toothNumber: number;
  type: string;
  toothNotations: [IToothNotation];
  timestamp: Date;
}

const TeethSchema = new mongoose.Schema({
  toothNumber: { type: Number, required: true },
  type: { type: String, enum: ['adult', 'kid'], default: 'adult', required: true },
  toothNotations: { type: Array, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const TeethModel = mongoose.model<ITeeth>('Teeth', TeethSchema, 'teeth');
export { TeethModel, ITeeth };
