import * as express from 'express';
// import { CustomerController } from '../controllers/customer-controller';
require('dotenv').config();

// import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class LocationRoutes {
  public router: express.Router = express.Router();
  //   private customerController = new CustomerController();

  constructor() {
    this.config();
  }
  private config(): void {
    // this.router.post('/create', isAuthenticated, this.customerController.createCustomer);
  }
}
