import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { TreatmentController } from '../controllers/treatment-controller';
require('dotenv').config();

export class TreatmentRoutes {
  public router: express.Router = express.Router();
  private treatmentController = new TreatmentController();
  constructor() {
    this.config();
  }

  private config(): void {
    this.router.get('/get-all-medical-history', isAuthenticated, this.treatmentController.getAllMedicalHistory);
  }
}
