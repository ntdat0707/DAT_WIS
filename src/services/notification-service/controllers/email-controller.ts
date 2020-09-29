import amqp from 'amqplib';
import chalk from 'chalk';
// const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
import { EQueueNames, rabbitmqURL } from '../../../utils/event-queues';
import { excuteSendingEmail, IEmailOptions } from '../../../utils/emailer';

const warningColor = chalk.keyword('yellow');

let open: any;
export const sendEmail = async () => {
  try {
    open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(EQueueNames.EMAIL, { durable: false });
    await ch.consume(
      EQueueNames.EMAIL,
      async (messageObj: any) => {
        // mail send here
        const msg = messageObj.content.toString();
        const data: IEmailOptions = JSON.parse(msg);
        await excuteSendingEmail(data);
        // ch.ack(messageObj);
      },
      { noAck: true }
    );
  } catch (error) {
    throw error;
  }
};

process.on('exit', (_code) => {
  if (open !== null) {
    open.close();
    //tslint:disable-next-line
    console.log(warningColor('warn') + ': Closing rabbitmq');
  }
});
