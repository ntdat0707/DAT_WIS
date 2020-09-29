import * as express from 'express';
import { AppointmentRoutes } from './appointment-routes';
import { AppointmentDetailRoutes } from './appointment-detail-routes';
import { AppointmentGroupRoutes } from './appointment-group-routes';
import { RecentBookingRoutes } from './recent-booking-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private appointmentRoutes = new AppointmentRoutes().router;
  private appointmentDetailRoutes = new AppointmentDetailRoutes().router;
  private appointmentGroupRoutes = new AppointmentGroupRoutes().router;
  private recentBookingRoutes = new RecentBookingRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/appointment', this.appointmentRoutes);
    this.router.use('/appointment-detail', this.appointmentDetailRoutes);
    this.router.use('/appointment-group', this.appointmentGroupRoutes);
    this.router.use('/recent-booking',this.recentBookingRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
