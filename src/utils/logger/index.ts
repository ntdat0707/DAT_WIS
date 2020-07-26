import moment from 'moment';
import { createLogger, format, LoggerOptions, transports } from 'winston';
import isEmpty from 'lodash/isEmpty';
require('dotenv').config();

import { RabbitMQTransport } from './custom-transporters';
import { ILogger, isLoggerData } from './common';

interface ILogChannel {
  file: boolean;
  console: boolean;
  mongo: boolean;
}
const myTransports = [];
// const x = process.env.LOG_CHANNELS;
let configChannels = {};
try {
  configChannels = JSON.parse(process.env.LOG_CHANNELS);
} catch (e) {}
// console.log(x);
if (!isEmpty(configChannels)) {
  const logChannels = configChannels as ILogChannel;
  if (logChannels.console !== undefined && logChannels.console === true)
    myTransports.push(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple(), format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
      })
    );

  if (logChannels.file !== undefined && logChannels.file === true) {
    myTransports.push(
      new transports.File({ filename: `log/debug-${moment().format('YYYYMMDD')}.log`, level: 'debug' })
    );
  }

  //database option
  if (logChannels.mongo !== undefined && logChannels.mongo === true) {
    myTransports.push(new RabbitMQTransport());
  }
}
// turn of logger if have no chanel
const isDisableLog: boolean = myTransports.length > 0 ? false : true;

const myFormat = format.printf((info): string => {
  if (info.level === 'error') {
    return `${info.timestamp} [${info.level}] [${info.label}]: ${info.message} \n ${info.stack}`;
  }

  if (info.splat) {
    return `${info.timestamp} [${info.level}] [${info.label}]: ${info.message} ${JSON.stringify(info.splat)}`;
  }

  return `${info.timestamp} [${info.level}] [${info.label}]: ${info.message}`;
});

const options: LoggerOptions = {
  transports: myTransports,
  format: format.combine(
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    myFormat
  ),
  silent: isDisableLog,
};

const logger = createLogger(options);
// logger.silent = true;

export { logger, ILogger, isLoggerData };
