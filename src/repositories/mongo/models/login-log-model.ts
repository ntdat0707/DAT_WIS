import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface ILoginLog extends Document {
  email: string;
  location: string;
  ip: string;
  timestamp: Date;
  browser: string;
  device: string;
  status: boolean;
  source: string;
  os: string;
}

const LoginLogSchema = new Schema({
  email: { type: String, required: false },
  location: { type: String, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, required: true },
  browser: { type: String, required: false },
  device: { type: String, required: false },
  status: { type: Boolean, required: true },
  source: { type: String, required: true },
  os: { type: String, required: false }
});

//Model
const LoginLogModel = mongoose.model<ILoginLog>('LoginLog', LoginLogSchema, 'login_log');
export { LoginLogModel, ILoginLog };
