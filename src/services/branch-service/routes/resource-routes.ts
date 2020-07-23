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
    this.router.post('/create', isAuthenticated, this.resourceController.createResource);
    this.router.delete('/delete-resource/:resourceId?', isAuthenticated, this.resourceController.deleteResource);
  }
}
