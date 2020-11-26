import mongoose from 'mongoose';

interface IMedicine extends mongoose.Document {
  name: string;
  content: string;
  unit: string;
  drugType: string;
  instruction: string;
  companyId: string;
}

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: false },
  unit: { type: String, required: false },
  drugType: { type: String, required: false },
  instruction: { type: String, required: false },
  companyId: { type: String, required: true }
});

//Model
const MedicineModel = mongoose.model<IMedicine>('Medicine', MedicineSchema, 'medicine');
export { MedicineModel, IMedicine };
