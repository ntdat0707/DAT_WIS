import * as express from 'express';
import { ServiceController } from '../controllers/service-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class ServiceRoutes {
  public router: express.Router = express.Router();
  private serviceController = new ServiceController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.serviceController.createService);
    this.router.delete('/delete-service/:serviceId?', isAuthenticated, this.serviceController.deleteService);
    this.router.get('/get-service/:serviceId?', isAuthenticated, this.serviceController.getService);
    this.router.get('/get-services', isAuthenticated, this.serviceController.getServices);
  }
}
