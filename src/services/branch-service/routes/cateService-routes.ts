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
    this.router.get('/get-all-cate-service', isAuthenticated, this.cateServiceController.getAllCateService);
    this.router.put('/update', isAuthenticated, this.cateServiceController.updateCateService);
    this.router.get('/get/:cateServiceId?', isAuthenticated, this.cateServiceController.getCateService);
    this.router.get('/get-cate-services', isAuthenticated, this.cateServiceController.getCateServices);
    this.router.delete('/delete/:cateServiceId?', isAuthenticated, this.cateServiceController.deleteCateService);
    this.router.get(
      '/:cateServiceId/get-all-service',
      isAuthenticated,
      this.cateServiceController.getServicesByCateService
    );
    this.router.get('/search-cate-service', isAuthenticated, this.cateServiceController.searchCateService);
  }
}
