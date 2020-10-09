import * as express from 'express';
require('dotenv').config();

import { AppointmentController } from '../controllers/appointment-controller';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { isAuthenticated as isAuthenticatedCustomer } from '../../../utils/middlewares/customer/auth';
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
    this.router.put(
      '/update-appointment/:appointmentId?',
      isAuthenticated,
      this.appointmentController.updateAppointment
    );
    this.router.delete(
      '/delete-appointment/:appointmentId?',
      isAuthenticated,
      this.appointmentController.deleteAppointment
    );
    this.router.get('/get-appointment/:appointmentId?', isAuthenticated, this.appointmentController.getAppointment);
    this.router.post(
      '/customer-create-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.customerCreateAppointment
    );
    this.router.get(
      '/customer-get-all-my-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.getAllMyAppointment
    );
    this.router.put(
      '/customer-cancel-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.cancelAppointment
    );
    this.router.get(
      '/customer-get-appointment/:appointmentId?',
      isAuthenticatedCustomer,
      this.appointmentController.getAppointmentCustomer
    );
    this.router.put(
      '/customer-reschedule-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.rescheduleAppointment
    );
    this.router.put(
      '/customer-set-ready-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.setReadyAppointment
    );
    this.router.put(
      '/customer-rating-appointment',
      isAuthenticatedCustomer,
      this.appointmentController.ratingAppointment
    );
  }
}
