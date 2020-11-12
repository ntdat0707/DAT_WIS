import * as express from 'express';
import { DiagnosticRoutes } from './diagnostic-routes';
import { TreatmentRoutes } from './treatment-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private treatmentRoutes = new TreatmentRoutes().router;
  private diagnosticsRoutes = new DiagnosticRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.treatmentRoutes);
    this.router.use('/diagnostics', this.diagnosticsRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
