import * as express from 'express';
require('dotenv').config();

import { AppointmentController } from '../controllers/appointment-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
export class AppointmentRoutes {
  public router: express.Router = express.Router();
  private appointmentController = new AppointmentController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-appointment', isAuthenticated, this.appointmentController.createAppointment);
    this.router.get(
      '/get-all-appointment-details',
      isAuthenticated,
      this.appointmentController.getAllAppointmentDetails
    );
    this.router.put('/update-appointment-status', isAuthenticated, this.appointmentController.updateAppointmentStatus);
    this.router.put('/update-appointment', isAuthenticated, this.appointmentController.updateAppointment);
    this.router.delete(
      '/delete-appointment/:appointmentId?',
      isAuthenticated,
      this.appointmentController.deleteAppointment
    );
    this.router.get('/get-appointment/:appointmentId?', isAuthenticated, this.appointmentController.getAppointment);
  }
}
