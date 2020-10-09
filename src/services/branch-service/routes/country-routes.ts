import * as express from 'express';
import { CountryController } from '../controllers/country-controller';
export class CountryRoutes {
  public router: express.Router = express.Router();
  private countryControllers = new CountryController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-country/:countryCode', this.countryControllers.getCountry);
  }
}
