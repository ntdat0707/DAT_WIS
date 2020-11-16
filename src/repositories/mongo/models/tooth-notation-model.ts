import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
interface IToothNotation extends mongoose.Document {
  _id: string;
  toothName: string;
  toothImage: string;
  style: string;
  timestamp: Date;
}

const ToothNotationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4() },
  toothName: { type: String, required: true },
  toothImage: { type: String, required: true },
  style: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const ToothNotationModel = mongoose.model<IToothNotation>('FaceTooth', ToothNotationSchema);
export { ToothNotationModel, IToothNotation };
