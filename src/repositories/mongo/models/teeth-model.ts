import mongoose, { Schema } from 'mongoose';
interface ITeeth extends mongoose.Document {
  _id: string;
  toothNumber: number;
  type: string;
  toothNotationsId: [string];
  timestamp: Date;
}

const TeethSchema = new mongoose.Schema({
  _id: Schema.Types.ObjectId,
  toothNumber: { type: Number, required: true },
  type: { type: String, enum: ['adult', 'kid'], default: 'adult', required: true },
  toothNotationsId: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  timestamp: { type: Date, default: Date.now }
});

//Model
const TeethModel = mongoose.model<ITeeth>('Teeth', TeethSchema, 'teeth');
export { TeethModel, ITeeth };
