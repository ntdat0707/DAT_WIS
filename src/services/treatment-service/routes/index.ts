import * as express from 'express';
import { DiagnosticRoutes } from './diagnosis-routes';
import { TreatmentRoutes } from './treatment-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private treatmentRoutes = new TreatmentRoutes().router;
  private diagnosisRoutes = new DiagnosticRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.treatmentRoutes);
    this.router.use('/diagnosis', this.diagnosisRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
