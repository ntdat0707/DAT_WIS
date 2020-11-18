import mongoose from 'mongoose';

interface ITreatmentDetail extends mongoose.Document {
  teethId: [string];
  serviceId: string;
  serviceName: string;
  price: number;
  staffId: string;
  procedureId: string;
  status: string;
  diagnoseId: string;
  note: string;
  createDate: Date;
  startDate: Date;
  endDate: Date;
  prescription: [
    {
      medicineId: string;
      quantity: number;
      noteMedicine: string;
      notePrescription: string;
    }
  ];
}

const TreatmentDetailSchema = new mongoose.Schema({
  teethId: { type: [String], required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  staffId: { type: String, required: true },
  procedureId: { type: String, required: true },
  status: { type: String, enum: ['Planned', 'Completed'], required: true },
  diagnoseId: { type: String, required: true },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: false },
  prescription: { type: Array, required: false }
});

//Model
const TreatmentDetailModel = mongoose.model<ITreatmentDetail>('TreatmentDetail', TreatmentDetailSchema);
export { TreatmentDetailModel, ITreatmentDetail };
