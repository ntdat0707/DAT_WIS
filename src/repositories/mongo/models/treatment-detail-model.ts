import mongoose from 'mongoose';

interface ITreatmentDetail extends mongoose.Document {
  teeth: [string];
  staffId: string;
  customerId: string;
  service: { serviceId: string; price: number };
  status: string;
  quantity: number;
  totalPrice: number;
  note: string;
  prescription: string;
  timestamp: Date;
}

const TreatmentDetailSchema = new mongoose.Schema({
  teeth: { type: Array, required: true },
  staffId: { type: String, required: true },
  customerId: { type: String, required: true },
  service: { type: Object, required: true },
  status: { type: String, required: true },
  quantity: { type: String, required: true },
  totalPrice: { type: String, required: true },
  note: { type: String, required: false },
  timestamp: { type: Date, required: true }
});

//Model
const TreatmentDetailModel = mongoose.model<ITreatmentDetail>('TreatmentDetail', TreatmentDetailSchema);
export { TreatmentDetailModel, ITreatmentDetail };
