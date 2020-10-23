import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { PaymentController } from '../controllers/payment-controller';
export class PaymentRoutes {
  public router: express.Router = express.Router();
  private paymentController = new PaymentController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-payment', isAuthenticated, this.paymentController.createPayment);
    this.router.post('/create-payment-method', isAuthenticated, this.paymentController.createPaymentMethod);
    this.router.put('/update-payment-method', isAuthenticated, this.paymentController.updatePaymentMethod);
    this.router.get('/get-list-payment-method', isAuthenticated, this.paymentController.getListPaymentMethod);
    this.router.delete(
      '/delete-payment-method/:paymentMethodId',
      isAuthenticated,
      this.paymentController.deletePaymentMethod
    );
  }
}
