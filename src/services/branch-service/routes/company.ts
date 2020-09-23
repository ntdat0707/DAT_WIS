import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { CompanyController } from '../controllers/company-controller';
export class CompanyRoutes {
  public router: express.Router = express.Router();
  private companyController = new CompanyController();

  constructor() {
    this.config();
  }

  private config(): void {
    this.router.post('/init', isAuthenticated, this.companyController.initCompany);
  }
}
