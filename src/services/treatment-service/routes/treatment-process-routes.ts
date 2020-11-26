import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { TreatmentProcessController } from '../controllers/treatment-process-controller';

require('dotenv').config();

export class TreatmentProcessRoutes {
  public router: express.Router = express.Router();
  private treatmentProcessController = new TreatmentProcessController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.treatmentProcessController.createTreatmentProcess);
    this.router.get('/get-medicines', isAuthenticated, this.treatmentProcessController.getAllMedicine);
    this.router.put(
      '/update/:treatmentProcessId',
      isAuthenticated,
      this.treatmentProcessController.updateTreatmentProcess
    );
    this.router.get(
      '/get-all-treatment-process/:treatmentId',
      isAuthenticated,
      this.treatmentProcessController.getAllTreatmentProcess
    );
    this.router.get(
      '/get-treatment-process/:treatmentProcessId',
      isAuthenticated,
      this.treatmentProcessController.getTreatmentProcess
    );
  }
}
