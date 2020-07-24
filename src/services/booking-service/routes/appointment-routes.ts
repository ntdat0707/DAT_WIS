import * as express from 'express';
require('dotenv').config();

import { AppointmentController } from '../controllers/appointment-controlelr';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class AppointmentRoutes {
  public router: express.Router = express.Router();
  private appointmentController = new AppointmentController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/test-api', isAuthenticated, this.appointmentController.testApi);
  }
}
