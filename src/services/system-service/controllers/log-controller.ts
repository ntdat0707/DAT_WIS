import amqp from 'amqplib';

import { EQueueNames, rabbitmqURL } from '../../../utils/event-queues';
import { LoggerModel, ILogger } from '../../../repositories/mongo/models';
let open: any;
export const writelog = async () => {
  try {
    open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(EQueueNames.LOG, { durable: false });
    await ch.consume(
      EQueueNames.LOG,
      async (messageObj: any) => {
        const msg = messageObj.content.toString();
        const data: ILogger = JSON.parse(msg);
        //write to mongoDB here
        const loggerModel = new LoggerModel(data);
        await loggerModel.save();
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
  }
});
