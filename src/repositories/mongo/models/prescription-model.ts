import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface IPrescription extends Document {
  diagnosis: string;
  note: string;
  createDate: Date;
  drugList: [
    {
      medicineId: string;
      quantity: number;
      note: string;
    }
  ];
}

const PrescriptionSchema = new mongoose.Schema({
  diagnosis: { type: String, required: false },
  note: { type: String, required: false },
  createDate: { type: Date, default: Date.now },
  drugList: [
    {
      medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
      quantity: { type: Number, required: false },
      note: { type: String, required: false }
    }
  ]
});

//Model
const PrescriptionModel = mongoose.model<IPrescription>('Prescription', PrescriptionSchema, 'prescription');
export { PrescriptionModel, IPrescription };
