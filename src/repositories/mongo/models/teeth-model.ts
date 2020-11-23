import mongoose, { Schema } from 'mongoose';
interface ITeeth extends mongoose.Document {
  toothNumber: number;
  type: string;
  toothNotationIds: [string];
  timestamp: Date;
}

const TeethSchema = new mongoose.Schema({
  toothNumber: { type: Number, required: true },
  type: { type: String, enum: ['adult', 'kid'], default: 'adult', required: true },
  toothNotationIds: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  timestamp: { type: Date, default: Date.now }
});

//Model
const TeethModel = mongoose.model<ITeeth>('Teeth', TeethSchema, 'teeth');
export { TeethModel, ITeeth };
