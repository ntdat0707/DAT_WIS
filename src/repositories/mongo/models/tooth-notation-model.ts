import mongoose from 'mongoose';
interface IToothNotation extends mongoose.Document {
  _id: string;
  toothCode: string;
  toothName: string;
  toothImage: string;
  order: number;
  style: string;
  timestamp: Date;
}

const ToothNotationSchema = new mongoose.Schema({
  toothCode: { type: String, required: true },
  toothName: { type: String, required: true },
  toothImage: { type: String, required: true },
  order: { type: Number, required: true },
  style: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const ToothNotationModel = mongoose.model<IToothNotation>('ToothNotation', ToothNotationSchema);
export { ToothNotationModel, IToothNotation };
