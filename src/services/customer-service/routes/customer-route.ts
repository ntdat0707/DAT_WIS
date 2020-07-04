import * as express from 'express';
import { CustomerController } from '../controllers/customer-controller';

import path from 'path';
require('dotenv').config();

export class CustomerRoutes {
  public router: express.Router = express.Router();
  private customerController = new CustomerController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/storage', express.static(path.join(__dirname, '/../../../../uploads')));

    this.router.post('/register', this.customerController.register);
    this.router.post('/login', this.customerController.login);
  }
}
