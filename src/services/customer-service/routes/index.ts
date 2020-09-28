import * as express from 'express';
import { CustomerRoutes } from './customer-route';
import { DealRoutes } from './deal-route';

class MainRoutes {
  public router: express.Router = express.Router();
  private customerRoutes = new CustomerRoutes().router;
  private dealRoutes = new DealRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.customerRoutes);
    this.router.use('/deal', this.dealRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
