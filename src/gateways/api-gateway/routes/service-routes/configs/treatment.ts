import { IServiceConfigs, API_BASE_PATH } from '../../configs';
require('dotenv').config();

const ROUTE = '/treatment';

const treatmentServiceConfigs: IServiceConfigs = {
  route: ROUTE,
  options: {
    target: 'http://' + process.env.SVC_TREATMENT_HOST + ':' + process.env.SVC_TREATMENT_PORT,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    prependPath: false,
    pathRewrite: {
      ['^' + API_BASE_PATH + ROUTE]: ''
    },
    headers: {
      Connection: 'keep-alive'
    }
  }
};

export { treatmentServiceConfigs };
