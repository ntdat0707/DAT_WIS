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
    this.router.get(
      '/get-medical-history-by-customer/:customerWisereId',
      isAuthenticated,
      this.treatmentController.getMedicalHistoryByCustomer
    );
    this.router.put(
      '/update-medical-history-of-customer/:customerWisereId',
      isAuthenticated,
      this.treatmentController.updateMedicalHistoryOfCustomer
    );
    this.router.post('/create-procedures', isAuthenticated, this.treatmentController.createProcedures);
    this.router.get(
      '/get-all-treatment/:customerWisereId',
      isAuthenticated,
      this.treatmentController.getAllTreatment
    );
  }
}
