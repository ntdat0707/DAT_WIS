import * as express from 'express';
import { CustomerRoutes } from './customer-route';
import { DealRoutes } from './deal-route';
import { FavoriteRoutes } from './favorite-route';

class MainRoutes {
  public router: express.Router = express.Router();
  private customerRoutes = new CustomerRoutes().router;
  private dealRoutes = new DealRoutes().router;
  private favoriteRoutes = new FavoriteRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.customerRoutes);
    this.router.use('/deal', this.dealRoutes);
    this.router.use('/favorite', this.favoriteRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
