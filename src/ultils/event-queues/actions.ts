import amqp from 'amqplib';
// const rabbitmqURL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
import { EChannels } from './channels';

const emit = async (channel: EChannels, message: object) => {
  try {
    var open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(channel, { durable: false });
    await ch.sendToQueue(channel, Buffer.from(JSON.stringify(message), 'utf8'));
  } catch (error) {
    throw error;
  }
};

export { emit };
