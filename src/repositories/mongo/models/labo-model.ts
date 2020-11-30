import mongoose from 'mongoose';

interface ILabo extends mongoose.Document {
  customerId: string;
  staffId: string;
  laboType: string;
  serviceId: string;
  sentDate: Date;
  receivedDate: Date;
  diagnostic: string;
  note: string;
  status: string;
  createDate: Date;
}

const LaboSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  staffId: { type: String, required: true },
  labo: { type: String, required: true },
  sentDate: { type: String, required: false },
  receivedDate: { type: String, required: false },
  diagnostic: { type: String, required: true },
  note: { type: String, required: false },
  status: { type: String, enum: ['ordered', 'deliveried'], default: 'ordered' },
  createDate: { type: Date, default: Date.now }
});

//Model
const LaboModel = mongoose.model<ILabo>('Labo', LaboSchema, 'labo');
export { LaboModel, ILabo };
