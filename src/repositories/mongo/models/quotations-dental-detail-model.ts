import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';
import { EQuotationDiscountType, EQuotationCurrencyUnit, EQuotationTeethType } from '../../../utils/consts';


interface IQuotationsDentalDetail extends Document {
  isAccept: boolean;
  quotationsDentalId: string;
  serviceId: string;
  createdAt: Date;
  staffId: string;
  teethNumbers: [string];
  teethType: string;
  discount: number;
  discountType: string;
  quantity: number;
  tax: number;
  currencyUnit: string;
  price: number;
}

const QuotationsDentalSchema = new Schema({
  isAccept: { type: Boolean, required: false },
  quotationsDentalId: { type: Schema.Types.ObjectId, ref: 'QuotationsDental' },
  serviceId: { type: String, required: false },
  createdAt: { type: String, default: Date.now },
  teethNumbers: [{ type: String, required: false }],
  teethType: { type: String, enum: Object.values(EQuotationTeethType), required: false },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), default: EQuotationDiscountType.PERCENT },
  quantity: { type: Number, required: false },
  currencyUnit: { type: String, enum: Object.values(EQuotationCurrencyUnit), default: EQuotationCurrencyUnit.VND },
  tax: { type: Number, required: false },
  price: { type: Number, required: false }
});

//Model
const QuotationsDentalDetailModel = mongoose.model<IQuotationsDentalDetail>(
  'QuotationsDentalDetail',
  QuotationsDentalSchema,
  'quotation_dental_detail'
);
export { QuotationsDentalDetailModel, IQuotationsDentalDetail };
