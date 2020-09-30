import * as express from 'express';
require('dotenv').config();

import { LocationDetailController } from '../controllers/location-detail-controller';
export class LocationDetailRoutes {
  public router: express.Router = express.Router();
  private locationDetailController = new LocationDetailController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-location-detail-marketplace', this.locationDetailController.createLocationDetail);
  }
}
