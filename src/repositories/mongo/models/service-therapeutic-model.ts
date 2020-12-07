import mongoose, { Schema } from 'mongoose';
interface IServiceTherapeutic extends mongoose.Document {
  name: string;
  serviceId: string;
  createOn: Date;
  therapeuticId: string;
}

const ServiceTherapeuticSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serviceId: { type: String, required: true },
  createOn: { type: Date, default: Date.now },
  therapeuticId: { type: Schema.Types.ObjectId, ref: 'TherapeuticTreatment' }
});

//Model
const ServiceTherapeuticModel = mongoose.model<IServiceTherapeutic>(
  'ServiceTherapeutic',
  ServiceTherapeuticSchema,
  'service_therapeutic'
);
export { ServiceTherapeuticModel, IServiceTherapeutic };
