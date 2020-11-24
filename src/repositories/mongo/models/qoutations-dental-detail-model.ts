import mongoose, { Schema } from 'mongoose';
import { EQoutationDiscountType, EQoutationCurrencyUnit } from '../../../utils/consts';

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

const QoutationsDentalSchema = new mongoose.Schema({
  qoutationsDentalId: { type: Schema.Types.ObjectId, ref: 'QoutationsDental' },
  serviceId: { type: String, required: true },
  createdAt: { type: String, default: Date.now },
  teeth: [{ type: String, required: true }],
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQoutationDiscountType), required: false },
  quantity: { type: String, required: true },
  currencyUnit: { type: String, enum: Object.values(EQoutationCurrencyUnit), default: EQoutationCurrencyUnit.VND },
  tax: { type: Number, required: false },
  price: { type: Number, required: true }
});

//Model
const QoutationsDentalDetailModel = mongoose.model<IQuotationsDentalDetail>(
  'QoutationsDentalDetail',
  QoutationsDentalSchema
);
export { QoutationsDentalDetailModel, IQuotationsDentalDetail };
