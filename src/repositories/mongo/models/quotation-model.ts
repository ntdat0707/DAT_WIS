import mongoose, { Schema } from 'mongoose';
interface IQuotation extends mongoose.Document {
  //   _id: string;
  code: string;
  date: Date;
  expiry: Date;
  treatmentId: string;
  note: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  createdDate: string;
  creatorId: string;
  creatorName: string;
  customerId: string;
  customerName: string;
  discount: number;

  timestamp: Date;
}

const QuotationSchema = new mongoose.Schema({
  //   _id: Schema.Types.ObjectId,
  diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnostic' },
  pathologicalIds: [{ type: Schema.Types.ObjectId, ref: 'ToothNotation' }],
  color: { type: String, required: false },
  colorText: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

//Model
const QuotationModel = mongoose.model<IQuotation>('Quotation', QuotationSchema, 'quotation');
export { QuotationModel, IQuotation };
