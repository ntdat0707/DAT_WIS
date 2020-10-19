import mongoose from 'mongoose';

interface IMqttUser extends mongoose.Document {
  isSupperUser: boolean;
  password: string;
  username: string;
}

const MqttUserSchema = new mongoose.Schema({
  isSupperUser: { type: Boolean, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true }
});

//Model
const MqttUserModel = mongoose.model<IMqttUser>('mqtt_user', MqttUserSchema, 'mqtt_user');
export { MqttUserModel, IMqttUser };
