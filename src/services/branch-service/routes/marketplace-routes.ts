import * as express from 'express';
import { MarketPlaceFieldController } from '../controllers/marketplace-field-controller';

export class MarketPlaceRoutes {
  public router: express.Router = express.Router();
  private marketplaceFieldController = new MarketPlaceFieldController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-marketplace-field', this.marketplaceFieldController.createMarketPlaceField);
    this.router.post('/create-marketplace-value', this.marketplaceFieldController.createMarketPlaceValue);
  }
}
