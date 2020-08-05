import amqp from 'amqplib';
// const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
import { EQueueNames, rabbitmqURL } from '../../../utils/event-queues';
import { excuteSendingEmail, IEmailOptions } from '../../../utils/emailer';

export const sendEmail = async () => {
  try {
    const open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(EQueueNames.EMAIL, { durable: false });
    await ch.consume(
      EQueueNames.EMAIL,
      async (messageObj) => {
        // mail send here
        const msg = messageObj.content.toString();
        const data: IEmailOptions = JSON.parse(msg);
        await excuteSendingEmail(data);
        // ch.ack(messageObj);
      },
      { noAck: true }
    );
  } catch (error) {
    throw new Error(error);
  }
};
