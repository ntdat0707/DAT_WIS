import mongoose, { Schema } from 'mongoose';
interface IDiagnosticDetail extends mongoose.Document {
  _id: string;
  code: string;
  name: string;
  pathologicalTeethIds: [string];
  diagnosticSubs: [IDiagnosticDetail];
  color: string;
  colorText: string;
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  _id: Schema.Types.ObjectId,
  code: { type: String, required: true },
  name: { type: String, required: true },
  pathologicalTeethIds: [{ type: Schema.Types.ObjectId, ref: 'Teeth' }],
  diagnosticSubs: { type: Array, required: false },
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
