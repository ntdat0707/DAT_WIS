import mongoose, { Schema } from 'mongoose';
import { EQuotationDiscountType, EQuotationCurrencyUnit, EQuotationTeethType } from '../../../utils/consts';

interface IQuotationsDentalDetail extends mongoose.Document {
  isAccept: boolean;
  quotationsDentalId: string;
  serviceId: string;
  createdAt: Date;
  staffId: string;
  teeth: [string];
  teethType: string;
  discount: number;
  discountType: string;
  quantity: number;
  tax: number;
  currencyUnit: string;
  price: number;
}

const QuotationsDentalSchema = new mongoose.Schema({
  isAccept: { type: Boolean, required: true },
  quotationsDentalId: { type: Schema.Types.ObjectId, ref: 'QuotationsDental' },
  serviceId: { type: String, required: true },
  createdAt: { type: String, default: Date.now },
  teeth: [{ type: String, required: true }],
  teethType: { type: String, enum: Object.values(EQuotationTeethType), required: true },
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), required: false },
  quantity: { type: Number, required: true },
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
