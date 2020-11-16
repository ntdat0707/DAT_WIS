import mongoose, { Schema } from 'mongoose';
import { ETeeth } from '../../../utils/consts';
import { IDiagnosticDetail } from './diagnostic-detail-model';

interface IDiagnostic extends mongoose.Document {
  teethNumber: number;
  teethId: string;
  staffId: string;
  //customerId: string;
  type: ETeeth;
  diagnostics: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticSchema = new mongoose.Schema({
  teethId: [{ type: Schema.Types.ObjectId, ref: 'Teeth' }],
  teethNumber: { type: Number, required: true },
  staffId: { type: String, required: true },
  //customerId: { type: String, required: true },
  diagnostics: [{ type: Schema.Types.ObjectId, ref: 'DiagnosticDetail' }],
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticModel = mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema, 'diagnostic');
export { DiagnosticModel, IDiagnostic };
