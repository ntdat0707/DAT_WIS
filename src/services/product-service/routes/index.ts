import { ProductRoutes } from './product-route';
import * as express from 'express';
class MainRoutes {
  public router: express.Router = express.Router();

  private productRoutes = new ProductRoutes().router;
  private customFieldRoutes = new ProductRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.productRoutes);
    this.router.use('/custom-field', this.customFieldRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
