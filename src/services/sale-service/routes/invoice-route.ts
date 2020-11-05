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
    this.router.get('/get-all-invoice', isAuthenticated, this.invoiceController.getAllInvoice);
    this.router.get('/get-invoice/:invoiceId', isAuthenticated, this.invoiceController.getInvoice);
    this.router.post('/create-invoice-log', isAuthenticated, this.invoiceController.createInvoiceLog);
    this.router.get('/get-list-invoice-log/:locationId', isAuthenticated, this.invoiceController.getListInvoicesLog);
  }
}
