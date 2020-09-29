import * as express from 'express';
import { RecentViewController } from '../controllers/recent-view-controller';
export class RecentViewRoutes {
  public router: express.Router = express.Router();
  private recentViewController = new RecentViewController();

  constructor() {
    this.config();
  }

  private config(): void {
    this.router.post('/market-place/create-recent-view', this.recentViewController.createRecentView);
    this.router.put('/market-place/update-recent-view?customerId=:customerId?locationId=:locationId');
  }
}
