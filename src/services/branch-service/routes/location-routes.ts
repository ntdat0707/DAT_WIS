import * as express from 'express';
require('dotenv').config();

import { LocationController } from '../controllers/location-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { uploadAsMiddleware } from '../../../utils/file-manager';
export class LocationRoutes {
  public router: express.Router = express.Router();
  private locationController = new LocationController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post(
      '/create-location',
      isAuthenticated,
      uploadAsMiddleware('photo'),
      this.locationController.createLocation
    );
    this.router.get('/get-all-locations', isAuthenticated, this.locationController.getAllLocations);
    this.router.get('/get-locations', isAuthenticated, this.locationController.getLocations);
    this.router.get('/get-location/:locationId?', isAuthenticated, this.locationController.getLocation);
    this.router.delete('/delete/:locationId', isAuthenticated, this.locationController.deleteLocation);
    this.router.post(
      '/create-location-working-time',
      isAuthenticated,
      this.locationController.createLocationWorkingTime
    );
    this.router.put(
      '/update-location/:locationId?',
      isAuthenticated,
      uploadAsMiddleware('photo'),
      this.locationController.updateLocation
    );
  }
}
