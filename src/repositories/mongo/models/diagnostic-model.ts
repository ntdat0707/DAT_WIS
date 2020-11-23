import mongoose, { Schema } from 'mongoose';
interface IDiagnostic extends mongoose.Document {
  _id: string;
  code: string;
  name: string;
  diagnosticSubs: [IDiagnostic];
  diagnosticPathId: string;
  icon: string;
  timestamp: Date;
}

const DiagnosticSchema = new mongoose.Schema({
  _id: Schema.Types.ObjectId,
  code: { type: String, required: false },
  name: { type: String, required: true },
  diagnosticSubs: { type: Array, required: false },
  diagnosticPathId: { type: Schema.Types.ObjectId, ref: 'DiagnosticPath' },
  icon: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticModel = mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema, 'diagnostic');
export { DiagnosticModel, IDiagnostic };
