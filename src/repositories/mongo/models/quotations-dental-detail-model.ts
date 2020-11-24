import mongoose, { Schema } from 'mongoose';
import { EQuotationDiscountType, EQuotationCurrencyUnit } from '../../../utils/consts';

interface IQuotationsDentalDetail extends mongoose.Document {
  qoutationsDentalId: string;
  serviceId: string;
  createdAt: Date;
  staffId: string;
  teeth: [string];
  discount: number;
  discountType: string;
  quantity: string;
  tax: number;
  currencyUnit: string;
  price: number;
}

const QuotationsDentalSchema = new mongoose.Schema({
  quotationsDentalId: { type: Schema.Types.ObjectId, ref: 'QuotationsDental' },
  serviceId: { type: String, required: true },
  createdAt: { type: String, default: Date.now },
  teeth: [{ type: String, required: true }],
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), required: false },
  quantity: { type: String, required: true },
  currencyUnit: { type: String, enum: Object.values(EQuotationCurrencyUnit), default: EQuotationCurrencyUnit.VND },
  tax: { type: Number, required: false },
  price: { type: Number, required: true }
});

//Model
const QuotationsDentalDetailModel = mongoose.model<IQuotationsDentalDetail>(
  'QuotationsDentalDetail',
  QuotationsDentalSchema
);
export { QuotationsDentalDetailModel, IQuotationsDentalDetail };