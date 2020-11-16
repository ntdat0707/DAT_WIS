import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
interface IDiagnosticDetail extends mongoose.Document {
  _id: string;
  code: string;
  name: string;
  pathologicalImages: [string];
  diagnosticSub: [string];
  color: string;
  colorText: string;
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4() },
  code: { type: String, required: true },
  name: { type: String, required: true },
  pathologicalImages: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  diagnosticSub: [{ type: Schema.Types.ObjectId, ref: 'DiagnosticDetail' }],
  color: { type: String, required: false },
  colorText: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticDetailModel = mongoose.model<IDiagnosticDetail>(
  'DiagnosticDetail',
  DiagnosticDetailSchema,
  'diagnosticDetail'
);
export { DiagnosticDetailModel, IDiagnosticDetail };
