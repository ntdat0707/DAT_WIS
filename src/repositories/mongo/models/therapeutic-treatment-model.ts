import mongoose from 'mongoose';

interface ITherapeuticTreatmentModel extends mongoose.Document {
  name: string;
  createDate: Date;
}

const TherapeuticTreatmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createDate: { type: Date, default: Date.now }
});

//Model
const TherapeuticTreatmentModel = mongoose.model<ITherapeuticTreatmentModel>(
  'TherapeuticTreatment',
  TherapeuticTreatmentSchema,
  'therapeutic_treatment'
);
export { TherapeuticTreatmentModel, ITherapeuticTreatmentModel };
