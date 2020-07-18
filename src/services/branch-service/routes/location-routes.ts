import * as express from 'express';
require('dotenv').config();

import { LocationController } from '../controllers/location-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class LocationRoutes {
  public router: express.Router = express.Router();
  private locationController = new LocationController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-location', isAuthenticated, this.locationController.createLocation);
    this.router.get('/get-all-locations', isAuthenticated, this.locationController.getAllLocations);
  }
}
