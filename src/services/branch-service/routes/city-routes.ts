import * as express from 'express';
import { CityController } from '../controllers/city-controller';
export class CityRoutes {
  public router: express.Router = express.Router();
  private cityControllers = new CityController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-cities/:countryCode', this.cityControllers.getCities);
  }
}
