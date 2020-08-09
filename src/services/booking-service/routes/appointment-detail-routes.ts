import * as express from 'express';
require('dotenv').config();

import { AppointmentDetailController } from '../controllers/appointment-detail-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class AppointmentDetailRoutes {
  public router: express.Router = express.Router();
  private appointmentDetailController = new AppointmentDetailController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create', isAuthenticated, this.appointmentDetailController.createAppointmentDetail);
    this.router.put('/update', isAuthenticated, this.appointmentDetailController.updateAppointmentDetail);
    this.router.delete(
      '/delete/:appointmentDetailId?',
      isAuthenticated,
      this.appointmentDetailController.deleteAppointmentDetail
    );
  }
}
