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
      uploadAsMiddleware({ name: 'photo', maxCount: 5 }),
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
      uploadAsMiddleware({ name: 'photo', maxCount: 5 }),
      this.locationController.updateLocation
    );
    this.router.get('/market-place/get-location/:pathName', this.locationController.getLocationMarketPlace);
    this.router.get('/get-location-detail', this.locationController.getLocationDetail);
    this.router.get(
      '/get-location-by-service-provider',
      this.locationController.getLocationByServiceProvider
    );

    this.router.get('/market-place/search', this.locationController.marketPlaceSearch);
    this.router.get('/market-place/suggested', this.locationController.marketPlaceSuggested);
  }
}
