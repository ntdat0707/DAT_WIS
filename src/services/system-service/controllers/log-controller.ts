import amqp from 'amqplib';
const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
import { EChannels } from '../../../ultils/event-queues/channels';
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
    await ch.assertQueue(EChannels.LOG, { durable: false });
    await ch.consume(EChannels.LOG, async messageObj => {
      // mail send here
      const msg = messageObj.content.toString();
      const data = JSON.parse(msg);
      //write to mongoDB here
      const logData: ILogger = {
        ...data
        //actor data
      };
      // console.log('log from system-service', logData);
      const loggerModel = new LoggerModel(logData);
      await loggerModel.save();
      // console.log('log from system-service', data);
      ch.ack(messageObj);
    });
  } catch (error) {
    console.log(error);
  }
};
