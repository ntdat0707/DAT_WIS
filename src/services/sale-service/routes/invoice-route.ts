import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { InvoiceController } from '../controllers/invoice-controller';
export class SaleRoutes {
  public router: express.Router = express.Router();
  private invoiceController = new InvoiceController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-invoice', isAuthenticated, this.invoiceController.createInvoice);
  }
}
