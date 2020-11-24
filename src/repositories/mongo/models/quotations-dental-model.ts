import mongoose, { Schema } from 'mongoose';
import { EQuotationDiscountType, EQuotationCurrencyUnit } from '../../../utils/consts';

interface IQuotationsDental extends mongoose.Document {
  quoteCode: string;
  Date: Date;
  Expire: Date;
  treatmentId: string;
  note: string;
  locationId: string;
  createdAt: Date;
  accountedBy: string;
  customerId: string;
  discount: number;
  discountType: string;
  quotationDentalDetails: [string];
  currencyUnit: string;
  totalPrice: number;
}

const QuotationsDentalSchema = new mongoose.Schema({
  quoteCode: { type: String, required: true },
  Date: { type: Date, required: true },
  Expire: { type: Date, required: true },
  treatmentId: { type: String, required: true },
  note: { type: String, required: false },
  locationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  accountedBy: { type: String, required: true },
  customerId: { type: String, required: true },
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), required: true },
  quotationsDentalDetails: [{ type: Schema.Types.ObjectId, ref: 'QuotationsDentalDetail' }],
  currencyUnit: { type: String, enum: Object.values(EQuotationCurrencyUnit), default: EQuotationCurrencyUnit.VND },
  totalPrice: { type: Number, required: false }
});

//Model
const QuotationsDentalModel = mongoose.model<IQuotationsDental>('QuotationsDental', QuotationsDentalSchema);
export { QuotationsDentalModel, IQuotationsDental };
