import * as express from 'express';
import { DiagnosticRoutes } from './diagnosis-routes';
import { TreatmentRoutes } from './treatment-routes';
import { QuotationsRoutes } from './quotations-routes';


class MainRoutes {
  public router: express.Router = express.Router();
  private treatmentRoutes = new TreatmentRoutes().router;
  private diagnosisRoutes = new DiagnosticRoutes().router;
  private quotationsRoutes = new QuotationsRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.treatmentRoutes);
    this.router.use('/diagnosis', this.diagnosisRoutes);
    this.router.use('/quotations', this.quotationsRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
