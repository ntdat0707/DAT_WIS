import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface IInvoiceDetailLog extends Document {
  serviceId: string;
  unit: string;
  quantity: number;
  price: number;
  listStaff: [object];
  timestamp: Date;
}

const InvoiceDetailSchema = new Schema({
  serviceId: { type: String, required: true },
  unit: { type: String, required: false },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  listStaff: { type: Array, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const InvoiceDetailLogModel = mongoose.model<IInvoiceDetailLog>('IInvoiceDetailLog', InvoiceDetailSchema);
export { InvoiceDetailLogModel, IInvoiceDetailLog, InvoiceDetailSchema };
