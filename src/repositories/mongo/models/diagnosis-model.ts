import mongoose, { Schema } from 'mongoose';

interface IDiagnosis extends mongoose.Document {
  teethNumber: number;
  teethId: string;
  staffId: string;
  status: string;
  //procedureId: string;
  diagnosticId: string;
  color: string;
  timestamp: Date;
}

const DiagnosisSchema = new mongoose.Schema({
  teethId: { type: Schema.Types.ObjectId, ref: 'Teeth' },
  teethNumber: { type: Number, required: true },
  staffId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'resolved'], required: true },
  //procedureId: { type: String, required: true },
  diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnostic' },
  color: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosisModel = mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema, 'diagnosis');
export { DiagnosisModel, IDiagnosis };
