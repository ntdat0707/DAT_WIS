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
    this.router.post('/create', isAuthenticated, this.customerController.createCustomer);
    this.router.put('/update/:customerId', isAuthenticated, this.customerController.updateCustomer);
    this.router.get('/all', isAuthenticated, this.customerController.getAllCustomerInCompany);
    this.router.delete('/delete/:customerId?', isAuthenticated, this.customerController.deleteCustomer);
    this.router.get('/get-customers', isAuthenticated, this.customerController.getCustomers);
    this.router.get('/get/:customerId', isAuthenticated, this.customerController.getCustomerById);
  }
}
