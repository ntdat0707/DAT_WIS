import mongoose, { Schema } from 'mongoose';
import { EQoutationDiscountType, EQoutationCurrencyUnit } from '../../../utils/consts';

interface IQuotationsDental extends mongoose.Document {
  quouteCode: string;
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
  qoutationDentalDetails: [string];
  currencyUnit: string;
  totalPrice: number;
}

const QoutationsDentalSchema = new mongoose.Schema({
  quouteCode: { type: String, required: true },
  Date: { type: Date, required: true },
  Expire: { type: Date, required: true },
  treatmentId: { type: String, required: true },
  note: { type: String, required: false },
  locationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  accountedBy: { type: String, required: true },
  customerId: { type: String, required: true },
  discount: { type: Number, required: false },
  discountType: { type: String, enum: Object.values(EQoutationDiscountType), required: true },
  qoutationsDentalDetails: [{ type: Schema.Types.ObjectId, ref: 'QoutationsDentalDetail' }],
  currencyUnit: { type: String, enum: Object.values(EQoutationCurrencyUnit), default: EQoutationCurrencyUnit.VND },
  totalPrice: { type: Number, required: false }
});

//Model
const QoutationsDentalModel = mongoose.model<IQuotationsDental>('QoutationsDental', QoutationsDentalSchema);
export { QoutationsDentalModel, IQuotationsDental };
