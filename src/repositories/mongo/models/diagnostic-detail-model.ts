import mongoose from 'mongoose';
import { IToothNotation } from './tooth-notation-model';

interface IDiagnosticDetail extends mongoose.Document {
  code: string;
  name: string;
  pathologicalImages: [IToothNotation];
  diagnosticSub: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  code: { type: Array, required: true },
  name: { type: String, required: true },
  pathologicalImages: { type: Array, required: true },
  diagnosticSub: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticDetailModel = mongoose.model<IDiagnosticDetail>('DiagnosticDetail', DiagnosticDetailSchema);
export { DiagnosticDetailModel, IDiagnosticDetail };
