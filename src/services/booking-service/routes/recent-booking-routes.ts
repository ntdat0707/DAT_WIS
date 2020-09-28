import * as express from 'express';
require('dotenv').config();

import { RecentBookingController } from '../controllers/recent-booking-controller';
export class RecentBookingRoutes {
  public router: express.Router = express.Router();
  private recentBookingController = new RecentBookingController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/market-place/create-recent-booking',this.recentBookingController.createRecentBooking);
  }
}
