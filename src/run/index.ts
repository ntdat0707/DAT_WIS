/* eslint-disable no-unused-vars */
import { logger } from '../utils/logger';
import { EEnvironments } from '../utils/consts';
import APIGateway from '../gateways/api-gateway/app';
import CustomerService from '../services/customer-service/app';
import SystemService from '../services/system-service/app';
import NotificationService from '../services/notification-service/app';
import StaffService from '../services/staff-service/app';
import BranchService from '../services/branch-service/app';
import BookingService from '../services/booking-service/app';
import SaleService from '../services/sale-service/app';

require('dotenv').config();
const nodeName = process.env.NODE_NAME;
const apiGatewayName = process.env.API_GTW_NAME;

/**
 * Start Express server.
 */

if (process.env.NODE_ENV === EEnvironments.PRODUCTION || process.env.NODE_ENV === EEnvironments.STAGING) {
  switch (nodeName) {
    case apiGatewayName:
      // code block
      const apiGateway = new APIGateway().app;
      apiGateway
        .listen(apiGateway.get('port'), (): void => {
          logger.info({
            label: apiGatewayName,
            message: `App is running at http://localhost:${apiGateway.get('port')} in mode ${apiGateway.get('env')} `
          });
        })
        .on('error', () => {
          logger.error({
            label: apiGatewayName,
            message: `gateway start fail at http://localhost:${apiGateway.get('port')} in mode ${apiGateway.get(
              'env'
            )} `
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
          label: 'branch-service',
          message: `App is running at http://localhost:${branchService.get('port')} in mode ${branchService.get(
            'env'
          )} `
        });
      });
      break;
    case 'booking-service':
      const bookingService = new BookingService().app;
      bookingService.listen(bookingService.get('port'), (): void => {
        logger.info({
          label: 'booking-service',
          message: `App is running at http://localhost:${bookingService.get('port')} in mode ${bookingService.get(
            'env'
          )} `
        });
      });
      break;
    case 'sale-service':
      const saleService = new SaleService().app;
      saleService.listen(saleService.get('port'), (): void => {
        logger.info({
          label: 'sale-service',
          message: `App is running at http://localhost:${saleService.get('port')} in mode ${saleService.get('env')} `
        });
      });
      break;
  }
} else {
  // develop mode
  const apiGateway = new APIGateway().app;
  const customerService = new CustomerService().app;
  apiGateway.listen(apiGateway.get('port'), (): void => {
    logger.info({
      label: apiGatewayName,
      message: `App is running at http://localhost:${apiGateway.get('port')} in mode ${apiGateway.get('env')} `
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

  const bookingService = new BookingService().app;
  bookingService.listen(bookingService.get('port'), (): void => {
    logger.info({
      label: 'booking-service',
      message: `App is running at http://localhost:${bookingService.get('port')} in mode ${bookingService.get('env')} `
    });
  });

  const saleService = new SaleService().app;
  saleService.listen(saleService.get('port'), (): void => {
    logger.info({
      label: 'sale-service',
      message: `App is running at http://localhost:${saleService.get('port')} in mode ${saleService.get('env')} `
    });
  });
}
// export default server;
