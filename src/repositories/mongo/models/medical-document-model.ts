import mongoose, { Schema } from 'mongoose';
import { EMedicalDocumentStatusType } from '../../../utils/consts';

interface IMedicalDocument extends mongoose.Document {
  treatmentId: string;
  medicalFileIds: [string];
  status: string;
  createdAt: Date;
}

const MedicalDocumentSchema = new mongoose.Schema({
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  medicalFileIds: [{ type: Schema.Types.ObjectId, ref: 'MedicalFile' }],
  status: { type: String, enum: Object.values(EMedicalDocumentStatusType), required: true },
  createdAt: { type: Date, default: Date.now }
});

//Model
const MedicalDocumentModel = mongoose.model<IMedicalDocument>(
  'MedicalDocument',
  MedicalDocumentSchema,
  'medical_document'
);
export { MedicalDocumentModel, IMedicalDocument };
