import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { isAuthenticated as isAuthenticatedCustomer } from '../../../utils/middlewares/customer/auth';
import { DiagnosticController } from '../controllers/diagnostic-conroller';

require('dotenv').config();

export class DiagnosticRoutes {
  public router: express.Router = express.Router();
  private diagnosticsController = new DiagnosticController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-all-medical-history', isAuthenticatedCustomer, this.diagnosticsController.getAllDiagnostic);
    this.router.post('/create-teeth', isAuthenticated, this.diagnosticsController.createTeeth);
    this.router.post('/create-diagnostic', isAuthenticated, this.diagnosticsController.createDiagnostic);
  }
}
