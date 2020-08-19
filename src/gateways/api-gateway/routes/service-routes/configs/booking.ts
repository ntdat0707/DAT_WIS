import { IServiceConfigs, API_BASE_PATH } from '../../configs';
require('dotenv').config();

const ROUTE = '/booking';

const bookingServiceConfigs: IServiceConfigs = {
  route: ROUTE,
  options: {
    target: 'http://' + process.env.SVC_BOOKING_HOST + ':' + process.env.SVC_BOOKING_PORT,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    prependPath: false,
    pathRewrite: {
      ['^' + API_BASE_PATH + ROUTE]: ''
    }
  }
};

export { bookingServiceConfigs };
