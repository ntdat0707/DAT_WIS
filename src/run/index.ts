/* eslint-disable no-unused-vars */
import { logger } from '../utils/logger';
import { EEnvironments } from '../utils/consts';
import Gateway from '../gateway/app';
import CustomerService from '../services/customer-service/app';
import SystemService from '../services/system-service/app';
import NotificationService from '../services/notification-service/app';
import StaffService from '../services/staff-service/app';
import BranchService from '../services/branch-service/app';

require('dotenv').config();
const nodeName = 'gateway' || process.env.NODE_NAME;
process.env.NODE_ENV = 'staging';
/**
 * Start Express server.
 */

console.log(process.env.NODE_ENV);
console.log(nodeName);

if (process.env.NODE_ENV === EEnvironments.PRODUCTION || process.env.NODE_ENV === EEnvironments.STAGING) {
  switch (nodeName) {
    case 'gateway':
      // code block
      const gateway = new Gateway().app;
      gateway
        .listen(gateway.get('port'), (): void => {
          logger.info({
            label: 'gateway',
            message: `App is running at http://localhost:${gateway.get('port')} in mode ${gateway.get('env')} `
          });
        })
        .on('error', () => {
          logger.error({
            label: 'gateway',
            message: `gateway start fail at http://localhost:${gateway.get('port')} in mode ${gateway.get('env')} `
          });
        });

      break;
    case 'customer-service':
      const customerService = new CustomerService().app;
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
    case 'staff-service':
      const staffService = new StaffService().app;
      staffService.listen(staffService.get('port'), (): void => {
        logger.info({
          label: 'customer-service',
          message: `App is running at http://localhost:${staffService.get('port')} in mode ${staffService.get('env')} `
        });
      });
      break;
    case 'branch-service':
      const branchService = new BranchService().app;
      branchService.listen(branchService.get('port'), (): void => {
        logger.info({
          label: 'customer-service',
          message: `App is running at http://localhost:${branchService.get('port')} in mode ${branchService.get(
            'env'
          )} `
        });
      });
      break;
  }
} else {
  // develop mode
  const gateway = new Gateway().app;
  const customerService = new CustomerService().app;

  gateway.listen(gateway.get('port'), (): void => {
    logger.info({
      label: 'gateway',
      message: `App is running at http://localhost:${gateway.get('port')} in mode ${gateway.get('env')} `
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

  const staffService = new StaffService().app;
  staffService.listen(staffService.get('port'), (): void => {
    logger.info({
      label: 'staff-service',
      message: `App is running at http://localhost:${staffService.get('port')} in mode ${staffService.get('env')} `
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

  const branchService = new BranchService().app;
  branchService.listen(branchService.get('port'), (): void => {
    logger.info({
      label: 'branch-service',
      message: `App is running at http://localhost:${branchService.get('port')} in mode ${branchService.get('env')} `
    });
  });
}
// export default server;
