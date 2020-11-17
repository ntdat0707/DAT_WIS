import { IServiceConfigs, API_BASE_PATH } from '../../configs';
require('dotenv').config();

const ROUTE = '/email';

const notificationServiceConfigs: IServiceConfigs = {
  route: ROUTE,
  options: {
    target: 'http://' + process.env.SVC_NOTIFICATION_HOST + ':' + process.env.SVC_NOTIFICATION_PORT,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    prependPath: false,
    pathRewrite: {
      ['^' + API_BASE_PATH + ROUTE]: ''
    }
  }
};

export { notificationServiceConfigs };
