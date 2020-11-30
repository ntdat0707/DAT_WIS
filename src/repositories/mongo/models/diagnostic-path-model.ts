import mongoose, { Schema } from 'mongoose';
interface IDiagnosticPath extends mongoose.Document {
  diagnosticId: string;
  pathologicalIds: [string];
  color: string;
  colorText: string;
  timestamp: Date;
}

const DiagnosticPathSchema = new mongoose.Schema({
  diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnostic' },
  pathologicalIds: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  color: { type: String, required: false },
  colorText: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticPathModel = mongoose.model<IDiagnosticPath>('DiagnosticPath', DiagnosticPathSchema, 'diagnostic_path');
export { DiagnosticPathModel, IDiagnosticPath };
