import mongoose from 'mongoose';

interface IDiagnosticDetail extends mongoose.Document {
  teeth: [string];
  staffId: string;
  customerId: string;
  diagnosticId: string;
  timestamp: Date;
}

const DiagnosticDetailSchema = new mongoose.Schema({
  teeth: { type: Array, required: true },
  staffId: { type: String, required: true },
  customerId: { type: String, required: true },
  diagnosticId: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const DiagnosticDetailModel = mongoose.model<IDiagnosticDetail>('DiagnosticDetail', DiagnosticDetailSchema);
export { DiagnosticDetailModel, IDiagnosticDetail };
