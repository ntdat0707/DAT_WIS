import { SaleRoutes } from './invoice-route';
import * as express from 'express';
class MainRoutes {
  public router: express.Router = express.Router();
  private saleRoutes = new SaleRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/sale', this.saleRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
