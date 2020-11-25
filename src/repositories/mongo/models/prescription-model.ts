import mongoose, { Schema } from 'mongoose';

interface IPrescription extends mongoose.Document {
  treatmentProcessId: string;
  note: string;
  createDate: Date;
  drugList: [
    {
      medicineId: string;
      quantity: number;
    }
  ];
}

const PrescriptionSchema = new mongoose.Schema({
  treatmentProcessId: { type: Schema.Types.ObjectId, ref: 'TreatmentProcess' },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now },
  drugList: [
    {
      medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
      quantity: { type: Number, required: false }
    }
  ]
});

//Model
const PrescriptionModel = mongoose.model<IPrescription>('Prescription', PrescriptionSchema, 'prescription');
export { PrescriptionModel, IPrescription };
