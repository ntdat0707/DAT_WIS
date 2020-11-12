import mongoose from 'mongoose';
import { ITeeth } from './teeth-model';

interface IDiagnosticDetail extends mongoose.Document {
  tooth: [ITeeth]; //[{number:26,facetooth:[{facename:xxxx,image:.....}]}]
  staffId: string;
  customerId: string;
  diagnosticId: string;
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  tooth: { type: Array, required: true },
  staffId: { type: String, required: true },
  customerId: { type: String, required: true },
  diagnosticId: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const DiagnosticDetailModel = mongoose.model<IDiagnosticDetail>('DiagnosticDetail', DiagnosticDetailSchema);
export { DiagnosticDetailModel, IDiagnosticDetail };
