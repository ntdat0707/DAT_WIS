import * as express from 'express';
import { CustomerController } from '../controllers/customer-controller';
require('dotenv').config();

import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class CustomerRoutes {
  public router: express.Router = express.Router();
  private customerController = new CustomerController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.customerController.createCustomerWisere);
    this.router.put(
      '/update-customer-wisere/:customerWisereId',
      isAuthenticated,
      this.customerController.updateCustomerWisere
    );
    this.router.get('/get-all-customer-wisere', isAuthenticated, this.customerController.getAllCustomerWisereInCompany);
    this.router.delete(
      '/delete-customer-wisere/:customerWisereId?',
      isAuthenticated,
      this.customerController.deleteCustomerWisere
    );
    this.router.get('/get-customer-wiseres', isAuthenticated, this.customerController.getCustomerWiseres);
    this.router.get(
      '/get-customer-wisere/:customerWisereId',
      isAuthenticated,
      this.customerController.getCustomerWisereById
    );
    this.router.post('/login', this.customerController.login);
    this.router.post('/verify-token', this.customerController.verifyTokenCustomer);
    this.router.post('/login-social', this.customerController.loginSocial);
    this.router.post('/login-apple', this.customerController.loginApple);
    this.router.post('/register', this.customerController.registerCustomer);
  }
}
