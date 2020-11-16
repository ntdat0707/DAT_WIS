import mongoose from 'mongoose';
import { ETeeth } from '../../../utils/consts';
import { IDiagnosticDetail } from './diagnostic-detail-model';
import { ITeeth } from './teeth-model';

interface IDiagnostic extends mongoose.Document {
  teeth: [ITeeth];
  staffId: [string];
  customerId: string;
  type: ETeeth;
  diagnostics: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticSchema = new mongoose.Schema({
  teeth: { type: Array, required: true },
  staffId: { type: Array, required: true },
  customerId: { type: String, required: true },
  diagnostics: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticModel = mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema);
export { DiagnosticModel, IDiagnostic };
