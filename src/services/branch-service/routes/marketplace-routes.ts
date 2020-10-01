import * as express from 'express';
import { MarketPlaceFieldsController } from '../controllers/marketplace-fields-controller';
export class MarketPlaceRoutes {
  public router: express.Router = express.Router();
  private marketplaceFieldController = new MarketPlaceFieldsController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-marketplace-field', this.marketplaceFieldController.createMarketPlaceField);
    this.router.post('/create-marketplace-value', this.marketplaceFieldController.createMarketPlaceValue);
  }
}
