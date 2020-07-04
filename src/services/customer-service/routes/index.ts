import * as express from 'express';
import { CustomerRoutes } from './customer-route';

class MainRoutes {
  public router: express.Router = express.Router();
  private customerRoutes = new CustomerRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.customerRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
