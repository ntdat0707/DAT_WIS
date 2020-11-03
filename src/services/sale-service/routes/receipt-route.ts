import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { ReceiptController } from '../controllers/receipt-controller';
export class ReceiptRoutes {
  public router: express.Router = express.Router();
  private paymentController = new ReceiptController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-invoice-receipt', isAuthenticated, this.paymentController.createInvoiceReceipt);
    this.router.post('/create-payment-method', isAuthenticated, this.paymentController.createPaymentMethod);
    this.router.put(
      '/update-payment-method/:paymentMethodId',
      isAuthenticated,
      this.paymentController.updatePaymentMethod
    );
    this.router.get('/get-list-payment-method', isAuthenticated, this.paymentController.getListPaymentMethod);
    this.router.delete(
      '/delete-payment-method/:paymentMethodId',
      isAuthenticated,
      this.paymentController.deletePaymentMethod
    );
  }
}
