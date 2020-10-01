//
import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { ResourceController } from '../controllers/resource-controller';

export class ResourceRoutes {
  public router: express.Router = express.Router();
  private resourceController = new ResourceController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-resources', isAuthenticated, this.resourceController.getResources);
    this.router.post('/create', isAuthenticated, this.resourceController.createResource);
    this.router.delete('/delete-resource/:resourceId?', isAuthenticated, this.resourceController.deleteResource);
    this.router.get('/all', isAuthenticated, this.resourceController.getResourcesInService);
    this.router.get('/get-resource/:resourceId?', isAuthenticated, this.resourceController.getResource);
    this.router.put('/update', isAuthenticated, this.resourceController.updateResource);
  }
}
