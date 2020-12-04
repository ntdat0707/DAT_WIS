import mogoose from 'mongoose';

interface ITherapeuticTreatmentModel extends mogoose.Document {
  name: string;
  createDate: Date;
}

const TherapeuticTreatmentSchema = new mogoose.Schema({
  name: { type: String, required: true },
  createDate: { type: Date, default: Date.now }
});

//Model
const TherapeuticTreatmentModel = mogoose.model<ITherapeuticTreatmentModel>(
  'TherapeuticTreatment',
  TherapeuticTreatmentSchema,
  'therapeutic_treatment'
);
export { TherapeuticTreatmentModel, ITherapeuticTreatmentModel };
