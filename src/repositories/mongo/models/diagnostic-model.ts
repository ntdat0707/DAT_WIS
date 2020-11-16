import mongoose from 'mongoose';
import { IDiagnosticDetail } from './diagnostic-detail-model';
import { ITeeth } from './teeth-model';

interface IDiagnostic extends mongoose.Document {
  tooth: [ITeeth]; //[{number:26,facetooth:[{facename:xxxx,image:.....}]}]
  staffId: [string];
  customerId: string;
  diagnostics: [IDiagnosticDetail];
  timestamp: Date;
}

const DiagnosticSchema = new mongoose.Schema({
  tooth: { type: Array, required: true },
  staffId: { type: Array, required: true },
  customerId: { type: String, required: true },
  diagnosticDetail: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosticModel = mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema);
export { DiagnosticModel, IDiagnostic };
