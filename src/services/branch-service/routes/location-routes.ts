import * as express from 'express';
require('dotenv').config();

import { LocationController } from '../controllers/location-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { uploadAsMiddleware } from '../../../utils/file-manager';
import { SearchController } from '../controllers/search-controller';
import { isAuthenticated as isAuthenticatedCustomer } from '../../../utils/middlewares/customer/auth';
export class LocationRoutes {
  public router: express.Router = express.Router();
  private locationController = new LocationController();
  private searchController = new SearchController();

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
    this.router.get('/market-place/get-location/:pathName', this.searchController.getLocationMarketPlace);
    this.router.get('/get-location-by-service-provider', this.searchController.getLocationByServiceProvider);
    this.router.get('/market-place/search', this.searchController.marketPlaceSearch);
    this.router.get('/market-place/suggested', this.searchController.marketPlaceSuggested);
    this.router.delete(
      '/market-place/delete-recent-view/:recentViewId',
      isAuthenticatedCustomer,
      this.searchController.deleteRecentView
    );
    this.router.delete(
      '/market-place/delete-recent-booking/:recentBookingId',
      isAuthenticatedCustomer,
      this.searchController.deleteRecentBooking
    );
    this.router.get('/market-place/suggest-city-country/:countryCode', this.searchController.suggestCountryAndCity);
  }
}
