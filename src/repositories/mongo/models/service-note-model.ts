import mongoose from 'mongoose';
interface IServiceNote extends mongoose.Document {
  name: string;
  serviceId: string;
  createOn: Date;
}

const ServiceNoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serviceId: { type: String, required: true },
  createOn: { type: Date, default: Date.now }
});

//Model
const ServiceNoteModel = mongoose.model<IServiceNote>('ServiceNote', ServiceNoteSchema, 'service_note');
export { ServiceNoteModel, IServiceNote };
