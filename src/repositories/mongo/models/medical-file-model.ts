import mongoose, { Schema } from 'mongoose';

interface IMedicalFile extends mongoose.Document {
  name: string;
  medicalDocumentId: string;
  path: string;
}

const MedicalFileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  medicalDocumentId: { type: Schema.Types.ObjectId, ref: 'MedicalDocument' },
  path: { type: String, required: false }
});

//Model
const MedicalFileModel = mongoose.model<IMedicalFile>('MedicalFile', MedicalFileSchema, 'medical_file');
export { MedicalFileModel, IMedicalFile };
