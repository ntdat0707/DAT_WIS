import mongoose from 'mongoose';
import { IInvoiceDetailLog } from './invoice-detail-log-model';

interface IInvoiceLog extends mongoose.Document {
  invoiceId: string;
  locationId: string;
  appointmentId: string;
  customerWisereId: string;
  source: string;
  note: string;
  discountId: string;
  totalQuantity: number;
  subTotal: number;
  totalAmount: number;
  tax: number;
  staffId: string;
  invoiceDetail: [IInvoiceDetailLog];
  status: string;
  balance: number;
  timestamp: Date;
}

const InvoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true },
  locationId: { type: String, required: true },
  appointmentId: { type: String, required: false },
  customerWisereId: { type: String, required: true },
  source: { type: String, required: false },
  note: { type: String, required: false },
  discountId: { type: String, required: false },
  totalQuantity: { type: Number, required: true },
  subTotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  tax: { type: Number, required: false },
  staffId: { type: String, required: true },
  invoiceDetail: { type: Array, required: true },
  status: { type: String, required: false },
  balance: { type: Number, required: false },
  timestamp: { type: Date, required: true }
});

//Model
const InvoiceLogModel = mongoose.model<IInvoiceLog>('InvoiceLog', InvoiceSchema, 'invoice_log');
export { InvoiceLogModel, IInvoiceLog };
