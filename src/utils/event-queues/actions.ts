import amqp from 'amqplib';
// const rabbitmqURL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

import { EQueueNames } from './queues';

const emit = async (channel: EQueueNames, message: object) => {
  let open = null;
  try {
    open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(channel, { durable: false });
    ch.sendToQueue(channel, Buffer.from(JSON.stringify(message), 'utf8'));
    await open.close();
  } catch (error) {
    if (open) await open.close();
    throw error;
  }
};

export { emit, rabbitmqURL };
