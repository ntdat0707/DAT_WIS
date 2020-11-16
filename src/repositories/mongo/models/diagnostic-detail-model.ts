import mongoose from 'mongoose';
import { IToothNotation } from './tooth-notation-model';
import { v4 as uuidv4 } from 'uuid';
interface IDiagnosticDetail extends mongoose.Document {
  _id: string;
  code: string;
  name: string;
  pathologicalImages: [IToothNotation];
  diagnosticSub: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4() },
  code: { type: String, required: true },
  name: { type: String, required: true },
  pathologicalImages: { type: Array, required: true },
  diagnosticSub: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticDetailModel = mongoose.model<IDiagnosticDetail>('DiagnosticDetail', DiagnosticDetailSchema);
export { DiagnosticDetailModel, IDiagnosticDetail };
