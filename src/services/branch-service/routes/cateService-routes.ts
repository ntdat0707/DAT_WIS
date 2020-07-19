import * as express from 'express';
import { CateServiceController } from '../controllers/cateService-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class CateServiceRoutes {
  public router: express.Router = express.Router();
  private cateServiceController = new CateServiceController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.cateServiceController.createCateService);
  }
}
