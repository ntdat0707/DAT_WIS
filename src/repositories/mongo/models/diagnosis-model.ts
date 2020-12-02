import mongoose, { Schema } from 'mongoose';
import { EDiagnosis } from '../../../utils/consts';

interface IDiagnosis extends mongoose.Document {
  teethId: string;
  teethNumber: string;
  staffId: string;
  staffName: string;
  status: string;
  treatmentId: string;
  diagnosticId: string;
  diagnosticName: string;
  timestamp: Date;
}

const DiagnosisSchema = new mongoose.Schema({
  teethId: { type: Schema.Types.ObjectId, ref: 'Teeth' },
  teethNumber: { type: String, required: false },
  staffId: { type: String, required: true },
  staffName: { type: String, required: false },
  status: {
    type: String,
    enum: Object.values(EDiagnosis),
    default: EDiagnosis.PENDING
  },
  treatmentId: { type: Schema.Types.ObjectId, required: 'Treatment' },
  diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnostic' },
  diagnosticName: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const DiagnosisModel = mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema, 'diagnosis');
export { DiagnosisModel, IDiagnosis };
