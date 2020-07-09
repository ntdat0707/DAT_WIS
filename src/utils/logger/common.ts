import moment from 'moment';

interface ILogger {
  label: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: Date;
}
function isLoggerData(data: object): data is ILogger {
  return (
    (data as ILogger).label &&
    typeof (data as ILogger).label === 'string' &&
    (data as ILogger).message &&
    typeof (data as ILogger).message === 'string' &&
    (data as ILogger).level &&
    typeof (data as ILogger).level === 'string' &&
    ['info', 'warn', 'error'].includes((data as ILogger).level) &&
    (data as ILogger).timestamp &&
    typeof (data as ILogger).timestamp === 'string' &&
    moment((data as ILogger).timestamp, 'YYYY-MM-DD HH:mm:ss', true).isValid()
  );
}

export { ILogger, isLoggerData };
