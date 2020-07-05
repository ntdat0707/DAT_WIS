/* eslint-disable no-unused-vars */
import { logger } from '../ultils/logger';
import { EEnvironments } from '../ultils/consts';
import Gateway from '../gateway/app';
import CustomerService from '../services/customer-service/app';
import SystemService from '../services/system-service/app';
import NotificationService from '../services/notification-service/app';

require('dotenv').config();
const nodeName = process.env.NODE_NAME;

/**
 * Start Express server.
 */
const gateway = new Gateway().app;
const customerService = new CustomerService().app;
// eslint-disable-next-line no-unused-vars

if (process.env.NODE_ENV === EEnvironments.PRODUCTION || process.env.NODE_ENV === EEnvironments.STAGING) {
  switch (nodeName) {
    case 'gateway':
      // code block
      gateway.listen(gateway.get('port'), (): void => {
        logger.info({
          label: 'gateway',
          message: `App is running at http://localhost:${gateway.get('port')} in mode ${gateway.get('env')} `
        });
      });

      break;
    case 'customer-service':
      customerService.listen(customerService.get('port'), (): void => {
        logger.info({
          label: 'customer-service',
          message: `App is running at http://localhost:${customerService.get('port')} in mode ${customerService.get(
            'env'
          )} `
        });
      });
      break;
    case 'system-service':
      const systemService = new SystemService().app;
      logger.info({
        label: 'system-service',
        message: `App is running in mode ${systemService.get('env')} `
      });
      break;
    case 'notification-service':
      const notificationService = new NotificationService().app;
      logger.info({
        label: 'notification-service',
        message: `App is running in mode ${notificationService.get('env')} `
      });
      break;
  }
} else {
  gateway.listen(gateway.get('port'), (): void => {
    logger.info({
      label: 'gateway',
      message: `App is running at http://localhost:${gateway.get('port')} in mode ${gateway.get('env')} `
    });
  });

  customerService.listen(customerService.get('port'), (): void => {
    logger.info({
      label: 'customer-service',
      message: `App is running at http://localhost:${customerService.get('port')} in mode ${customerService.get(
        'env'
      )} `
    });
  });

  const systemService = new SystemService().app;
  logger.info({
    label: 'system-service',
    message: `App is running in mode ${systemService.get('env')} `
  });
  const notificationService = new NotificationService().app;
  logger.info({
    label: 'notification-service',
    message: `App is running in mode ${notificationService.get('env')} `
  });
}
// export default server;
