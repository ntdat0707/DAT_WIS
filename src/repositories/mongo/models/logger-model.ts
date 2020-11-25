import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface ILogger extends Document {
  label: string;
  message: string;
  timestamp: Date;
  level: string;
}

const LoggerSchema = new Schema({
  label: { type: String, required: true },
  message: { type: Object, required: true },
  timestamp: { type: Date, required: true },
  level: { type: String, required: true }
});

//Model
const LoggerModel = mongoose.model<ILogger>('Logger', LoggerSchema, 'logger');
export { LoggerModel, ILogger };
