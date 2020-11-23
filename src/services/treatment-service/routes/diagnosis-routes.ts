import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { DiagnosticController } from '../controllers/diagnosis-controller';

require('dotenv').config();

export class DiagnosticRoutes {
  public router: express.Router = express.Router();
  private diagnosticsController = new DiagnosticController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-all-diagnostic', isAuthenticated, this.diagnosticsController.getAllDiagnostic);
    this.router.post('/create-teeth', isAuthenticated, this.diagnosticsController.createTeeth);
    this.router.post('/create-diagnostic', this.diagnosticsController.createDiagnostic);
    this.router.post('/create-diagnosis', this.diagnosticsController.createDiagnosis);
    this.router.get('/get-teeth/:teethId', isAuthenticated, this.diagnosticsController.getTeeth);
    this.router.get('/get-diagnosis', isAuthenticated, this.diagnosticsController.getAllDiagnosis);
    this.router.put('/update-diagnosis/:diagnosisId', isAuthenticated, this.diagnosticsController.updateDiagnosis);
    this.router.post('/diagnosis/add-color/:diagnosticId', this.diagnosticsController.addColor);
  }
}
