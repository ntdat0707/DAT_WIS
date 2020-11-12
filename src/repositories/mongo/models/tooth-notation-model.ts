import mongoose from 'mongoose';

interface IToothNotation extends mongoose.Document {
  toothName: string;
  toothImage: string;
  timestamp: Date;
}

const ToothNotationSchema = new mongoose.Schema({
  toothName: { type: String, required: true },
  toothImage: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const ToothNotationModel = mongoose.model<IToothNotation>('FaceTooth', ToothNotationSchema);
export { ToothNotationModel, IToothNotation };
