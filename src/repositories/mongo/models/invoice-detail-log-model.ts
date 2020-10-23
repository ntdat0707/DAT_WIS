import mongoose from 'mongoose';

interface IInvoiceDetailLog extends mongoose.Document {
  serviceId: string;
  unit: string;
  quantity: number;
  price: number;
  listStaff: [object];
  timestamp: Date;
}

const InvoiceDetailSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  unit: { type: String, required: false },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  listStaff: { type: Array, required: true },
  timestamp: { type: Date, required: true }
});

//Model
const InvoiceDetailLogModel = mongoose.model<IInvoiceDetailLog>(
  'IInvoiceDetailLog',
  InvoiceDetailSchema
  //'invoice_detail_log'
);
export { InvoiceDetailLogModel, IInvoiceDetailLog, InvoiceDetailSchema };
