import mongoose from 'mongoose';
import { IDiagnosticDetail } from './diagnostic-detail-model';

interface IDiagnostic extends mongoose.Document {
  diagnosticDetail: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticSchema = new mongoose.Schema({
  diagnosticDetail: { type: Array, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const DiagnosticModel = mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema);
export { DiagnosticModel, IDiagnostic };
