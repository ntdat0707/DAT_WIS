import mongoose from 'mongoose';

interface ILogger extends mongoose.Document {
  label: string;
  message: string;
  timestamp: Date;
  level: string;
}

const LoggerSchema = new mongoose.Schema({
  label: { type: String, required: true },
  message: { type: Object, required: true },
  timestamp: { type: Date, required: true },
  level: { type: String, required: true }
});

//Model
const LoggerModel = mongoose.model<ILogger>('Logger', LoggerSchema, 'logger');
export { LoggerModel, ILogger };
