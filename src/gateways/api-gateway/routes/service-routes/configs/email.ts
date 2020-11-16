import { IServiceConfigs, API_BASE_PATH } from '../../configs';
require('dotenv').config();

const ROUTE = '/email';

const emailServiceConfigs: IServiceConfigs = {
  route: ROUTE,
  options: {
    target: 'http://' + process.env.SVC_EMAIL_HOST+ ':' + process.env.SVC_EMAIL_PORT,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    prependPath: false,
    pathRewrite: {
      ['^' + API_BASE_PATH + ROUTE]: ''
    }
  }
};

export { emailServiceConfigs };
