import mongoose from '../configs/connector';
import { Schema, Document } from 'mongoose';

interface IMqttUser extends Document {
  isSupperUser: boolean;
  password: string;
  username: string;
}

const MqttUserSchema = new Schema({
  isSupperUser: { type: Boolean, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true }
});

//Model
const MqttUserModel = mongoose.model<IMqttUser>('mqtt_user', MqttUserSchema, 'mqtt_user');
export { MqttUserModel, IMqttUser };
