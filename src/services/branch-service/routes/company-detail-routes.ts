import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { CompanyDetailController } from '../controllers/company-detail-controller';
export class CompanyDetailRoutes {
  public router: express.Router = express.Router();
  private companyDetailController = new CompanyDetailController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-company-detail', isAuthenticated, this.companyDetailController.createCompanyDetail);
  }
}
