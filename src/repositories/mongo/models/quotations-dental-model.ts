import mongoose, { Schema } from 'mongoose';
import { EQuotationDiscountType, EQuotationCurrencyUnit } from '../../../utils/consts';

interface IQuotationsDental extends mongoose.Document {
  quoteCode: string;
  date: Date;
  expire: Date;
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
  quoteCode: { type: String, required: false },
  date: { type: Date, required: true },
  expire: { type: Date, required: false },
  treatmentId: { type: String, required: true },
  note: { type: String, required: false },
  locationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  accountedBy: { type: String, required: true },
  customerId: { type: String, required: true },
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), default: EQuotationDiscountType.PERCENT },
  quotationsDentalDetails: [{ type: Schema.Types.ObjectId, ref: 'QuotationsDentalDetail' }],
  currencyUnit: { type: String, enum: Object.values(EQuotationCurrencyUnit), default: EQuotationCurrencyUnit.VND },
  totalPrice: { type: Number, default: 0 }
});

//Model
const QuotationsDentalModel = mongoose.model<IQuotationsDental>(
  'QuotationsDental',
  QuotationsDentalSchema,
  'quotation_dental'
);
export { QuotationsDentalModel, IQuotationsDental };
