import Transport from 'winston-transport';
import { emit, EQueueNames } from '../../event-queues';
import { isLoggerData } from '../common';
class RabbitMQTransport extends Transport {
  constructor() {
    super();

    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail,
    //   logentries, etc.).
    //
  }

  async log(info: any, callback: any) {
    if (isLoggerData(info)) {
      await emit(EQueueNames.LOG, info);
      callback();
    } else {
      console.log('log data must be ILogger');
    }
  }
}

export default RabbitMQTransport;
