import * as express from 'express';
require('dotenv').config();

import { LocationController } from '../controllers/location-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { uploadAsMiddleware } from '../../../utils/file-manager';
import { LocationDetailController } from '../controllers/location-detail-controller';
export class LocationDetailRoutes {
  public router: express.Router = express.Router();
  private locationDetailController = new LocationDetailController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-location-detail', this.locationDetailController.createLocationDetail);
  }
}
