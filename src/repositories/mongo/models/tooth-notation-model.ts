import mongoose, { Schema } from 'mongoose';
interface IToothNotation extends mongoose.Document {
  toothCode: string;
  teethId: string;
  toothName: string;
  toothImage: string;
  position: number;
  style: string;
  diagnosticPathId: string;
  timestamp: Date;
}

const ToothNotationSchema = new mongoose.Schema({
  teethId: { type: Schema.Types.ObjectId, ref: 'Teeth' },
  toothCode: { type: String, required: true },
  toothName: { type: String, required: true },
  toothImage: { type: String, required: true },
  position: { type: Number, required: true },
  style: { type: String, required: false },
  diagnosticPathId: { type: Schema.Types.ObjectId, ref: 'DiagnosticPath' },
  timestamp: { type: Date, default: Date.now }
});

//Model
const ToothNotationModel = mongoose.model<IToothNotation>('ToothNotation', ToothNotationSchema, 'tooth_notation');
export { ToothNotationModel, IToothNotation };
