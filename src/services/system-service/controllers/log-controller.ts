import amqp from 'amqplib';
// const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
import { EQueueNames, rabbitmqURL } from '../../../utils/event-queues';
import { LoggerModel, ILogger } from '../../../repositories/mongo/models';

// (async () => {
//   try {
//     var open = await amqp.connect(rabbitmqURL);
//     const ch = await open.createChannel();
//     await ch.assertQueue(Echannels.LOG, { durable: false });
//     await ch.consume(Echannels.LOG, async messageObj => {
//       // mail send here
//       const msg = messageObj.content.toString();
//       const logData = JSON.parse(msg);
//       //write to mongoDB here
//       console.log('log from system-service', logData);
//       ch.ack(messageObj);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// })();

export const writelog = async () => {
  try {
    var open = await amqp.connect(rabbitmqURL);
    const ch = await open.createChannel();
    await ch.assertQueue(EQueueNames.LOG, { durable: false });
    await ch.consume(
      EQueueNames.LOG,
      async messageObj => {
        // mail send here
        const msg = messageObj.content.toString();
        const data: ILogger = JSON.parse(msg);
        //write to mongoDB here
        const loggerModel = new LoggerModel(data);
        await loggerModel.save();
        // console.log('log from system-service', data);
        // ch.ack(messageObj);
      },
      { noAck: true }
    );
  } catch (error) {
    console.log(error);
  }
};
