import { InvoiceRoutes } from './invoice-route';
import * as express from 'express';
import { PaymentRoutes } from './payment-route';
class MainRoutes {
  public router: express.Router = express.Router();
  private invoiceRoutes = new InvoiceRoutes().router;
  private paymentRoutes = new PaymentRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/invoice', this.invoiceRoutes);
    this.router.use('/payment', this.paymentRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
