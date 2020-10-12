import amqp from 'amqplib/callback_api';
import chalk from 'chalk';
// const rabbitmqURL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const rabbitmqURL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

import { EQueueNames } from './queues';
const warningColor = chalk.keyword('yellow');
let ch: any = null;
let connection: any = null;
//tslint:disable-next-line
amqp.connect(rabbitmqURL, function (_err, conn) {
  connection = conn;
  //tslint:disable-next-line
  conn.createChannel(function (_err, channel) {
    ch = channel;
  });
});

/**
 * Send a message to queue
 *
 * @param {EQueueNames} queueName
 * @param {object} message
 */
const emit = async (queueName: EQueueNames, message: object) => {
  try {
    if (ch !== null) {
      await ch.assertQueue(queueName, { durable: false });
      await ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message), 'utf8'));
    } else {
      //tslint:disable-next-line
      console.log(
        warningColor('warn') + ': Rabbitmq is not ready, message will not be sent to queue.',
        JSON.stringify(message)
      );
    }
  } catch (error) {
    throw error;
  }
};

process.on('exit', (_code) => {
  if (connection !== null) {
    connection.close();
    //tslint:disable-next-line
    warningColor('warn') + ': Closing rabbitmq';
  }
});

export { emit, rabbitmqURL };
