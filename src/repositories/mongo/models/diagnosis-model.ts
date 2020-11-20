import mongoose, { Schema } from 'mongoose';

interface IDiagnosis extends mongoose.Document {
  teethId: string;
  staffId: string;
  status: string;
  //treatmentId: string;
  diagnosticId: string;
  timestamp: Date;
}

const DiagnosisSchema = new mongoose.Schema({
  teethId: { type: Schema.Types.ObjectId, ref: 'Teeth' },
  staffId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'resolved'], required: true },
  //treatmentId: { type: String, required: true },
  diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnostic' },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosisModel = mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema, 'diagnosis');
export { DiagnosisModel, IDiagnosis };
