import * as express from 'express';
import { LocationRoutes } from './location-routes';
import { ServiceRoutes } from './service-routes';
import { ResourceRoutes } from './resource-routes';
import { CateServiceRoutes } from './cateService-routes';
import { CompanyRoutes } from './company';
import { MarketPlaceRoutes } from './marketplace-routes';
import { MaterialRoutes } from './material-routes';
class MainRoutes {
  public router: express.Router = express.Router();
  private locationRoutes = new LocationRoutes().router;
  private serviceRoutes = new ServiceRoutes().router;
  private resourceRoutes = new ResourceRoutes().router;
  private cateServiceRoutes = new CateServiceRoutes().router;
  private companyRoutes = new CompanyRoutes().router;
  private marketPlaceRoutes = new MarketPlaceRoutes().router;
  private materialRoutes = new MaterialRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/location', this.locationRoutes);
    this.router.use('/service', this.serviceRoutes);
    this.router.use('/resource', this.resourceRoutes);
    this.router.use('/cate-service', this.cateServiceRoutes);
    this.router.use('/company', this.companyRoutes);
    this.router.use('/marketplace', this.marketPlaceRoutes);
    this.router.use('/material', this.materialRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
