import * as express from 'express';
import { LocationRoutes } from './location-routes';
import { ServiceRoutes } from './service-routes';
import { ResourceRoutes } from './resource-routes';
import { CateServiceRoutes } from './cateService-routes';
import { CompanyRoutes } from './company';
import { CompanyDetailRoutes } from './company-detail-routes';
import { CountryRoutes } from './country-routes';
import { CityRoutes } from './city-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private locationRoutes = new LocationRoutes().router;
  private serviceRoutes = new ServiceRoutes().router;
  private resourceRoutes = new ResourceRoutes().router;
  private cateServiceRoutes = new CateServiceRoutes().router;
  private companyRoutes = new CompanyRoutes().router;
  private companyDetailRoutes = new CompanyDetailRoutes().router;
  private countryRoutes = new CountryRoutes().router;
  private cityRoutes = new CityRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/location', this.locationRoutes);
    this.router.use('/service', this.serviceRoutes);
    this.router.use('/resource', this.resourceRoutes);
    this.router.use('/cate-service', this.cateServiceRoutes);
    this.router.use('/company', this.companyRoutes);
    this.router.use('/company-detail', this.companyDetailRoutes);
    this.router.use('/country', this.countryRoutes);
    this.router.use('/city', this.cityRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
