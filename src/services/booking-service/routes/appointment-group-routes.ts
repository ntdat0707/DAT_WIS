import * as express from 'express';
require('dotenv').config();

import { AppointmentGroupController } from '../controllers/appointment-group-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class AppointmentGroupRoutes {
  public router: express.Router = express.Router();
  private appointmentGroupController = new AppointmentGroupController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.appointmentGroupController.createAppointmentGroup);
    this.router.get(
      '/get-appointment-group/:appointmentGroupId?',
      isAuthenticated,
      this.appointmentGroupController.getAppointmentGroup
    );
  }
}
