import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';
import {  EQuotationDiscountType, EStatusProcedure  } from '../../../utils/consts';

interface IProcedure extends Document {
  treatmentId: string;
  locationId: string;
  customerId: string;
  staffId: string;
  teethId: [string];
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: string;
  totalPrice: number;
  status: string;
  note: string;
  createDate: Date;
}

const ProcedureSchema = new Schema({
  treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
  locationId: { type: String, required: true },
  customerId: { type: String, required: true },
  staffId: { type: String, required: true },
  teethId: [{ type: Schema.Types.ObjectId, ref: 'Teeth' }],
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: Object.values(EQuotationDiscountType), default: EQuotationDiscountType.PERCENT },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: Object.values(EStatusProcedure), default: EStatusProcedure.NEW },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now }
});

//Model
const ProcedureModel = mongoose.model<IProcedure>('Procedure', ProcedureSchema, 'procedure');
export { ProcedureModel, IProcedure };
