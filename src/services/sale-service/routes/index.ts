import { SaleRoutes } from './invoice-route';
import * as express from 'express';
import { ReceiptRoutes } from './receipt-route';
class MainRoutes {
  public router: express.Router = express.Router();

  private saleRoutes = new SaleRoutes().router;
  private receiptRoutes = new ReceiptRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.saleRoutes);
    this.router.use('/receipt', this.receiptRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
