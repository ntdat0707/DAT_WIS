import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { ReceiptController } from '../controllers/receipt-controller';
export class ReceiptRoutes {
  public router: express.Router = express.Router();
  private receiptController = new ReceiptController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-invoice-receipt', isAuthenticated, this.receiptController.createInvoiceReceipt);
    this.router.post('/create-new-receipt', isAuthenticated, this.receiptController.createNewReceipt);
    this.router.get('/get-all-receipt', isAuthenticated, this.receiptController.getAllReceipt);
    this.router.get('/get-receipt/:receiptId', isAuthenticated, this.receiptController.getReceipt);
    this.router.post('/create-payment-method', isAuthenticated, this.receiptController.createPaymentMethod);
    this.router.put(
      '/update-payment-method/:paymentMethodId',
      isAuthenticated,
      this.receiptController.updatePaymentMethod
    );
    this.router.get('/get-list-payment-method', isAuthenticated, this.receiptController.getListPaymentMethod);
    this.router.delete(
      '/delete-payment-method/:paymentMethodId',
      isAuthenticated,
      this.receiptController.deletePaymentMethod
    );
  }
}
