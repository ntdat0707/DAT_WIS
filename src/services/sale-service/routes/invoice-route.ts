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
    this.router.post('/checkout', isAuthenticated, this.invoiceController.checkout);
    this.router.post('/create-payment', isAuthenticated, this.invoiceController.createPayment);
    this.router.get('/get-all-invoice', isAuthenticated, this.invoiceController.getAllInvoice);
    this.router.delete('/delete-invoice/:invoiceId', isAuthenticated, this.invoiceController.deleteInvoice);
  }
}
