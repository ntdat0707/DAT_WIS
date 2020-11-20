import mongoose, { Schema } from 'mongoose';
import { EStatusProcedure } from '../../../utils/consts';

interface IProcedure extends mongoose.Document {
  treatmentId: string;
  staffId: string;
  teethId: [string];
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  discount: number;
  totalPrice: number;
  status: string;
  note: string;
  createDate: Date;
}

const ProcedureSchema = new mongoose.Schema({
  treatmentId: { type: String, required: true },
  staffId: { type: String, required: true },
  teethId: [{ type: Schema.Types.ObjectId, ref: 'Teeth' }],
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: Object.values(EStatusProcedure), required: true },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now }
});

//Model
const ProcedureModel = mongoose.model<IProcedure>('Procedure', ProcedureSchema, 'procedure');
export { ProcedureModel, IProcedure };
