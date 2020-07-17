import * as express from 'express';
import { LocationRoutes } from './location-routes';
import { ServiceRoutes } from './service-routes';
import { ResourceRoutes } from './resource-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private locationRoutes = new LocationRoutes().router;
  private serviceRoutes = new ServiceRoutes().router;
  private resourceRoutes = new ResourceRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/location', this.locationRoutes);
    this.router.use('/service', this.serviceRoutes);
    this.router.use('/resource', this.resourceRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
