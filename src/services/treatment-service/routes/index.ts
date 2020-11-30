import * as express from 'express';
import { DiagnosticRoutes } from './diagnosis-routes';
import { TreatmentRoutes } from './treatment-routes';
import { QuotationsRoutes } from './quotations-routes';
import { TreatmentProcessRoutes } from './treatment-process-routes';
import { MedicalDocumentRoutes } from './medical-document-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private treatmentRoutes = new TreatmentRoutes().router;
  private diagnosisRoutes = new DiagnosticRoutes().router;
  private quotationsRoutes = new QuotationsRoutes().router;
  private treatmentProcessRoutes = new TreatmentProcessRoutes().router;
  private medicalDocumentRoutes = new MedicalDocumentRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.treatmentRoutes);
    this.router.use('/diagnosis', this.diagnosisRoutes);
    this.router.use('/quotations', this.quotationsRoutes);
    this.router.use('/treatment-process', this.treatmentProcessRoutes);
    this.router.use('/medical-document', this.medicalDocumentRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
