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
  }
}
