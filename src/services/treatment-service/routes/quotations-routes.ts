import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { QuotationsController } from '../controllers/quotations-controller';

require('dotenv').config();

export class QuotationsRoutes {
  public router: express.Router = express.Router();
  private quotationsController = new QuotationsController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/update-quotations-dental/:quotationId', isAuthenticated, this.quotationsController.updateQuotationsDental);
  }
}

