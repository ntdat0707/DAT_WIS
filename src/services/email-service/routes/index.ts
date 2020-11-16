import * as express from 'express';
import { TreatmentRoutes } from './treatment-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private treatmentRoutes = new TreatmentRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/webhook', this.treatmentRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
