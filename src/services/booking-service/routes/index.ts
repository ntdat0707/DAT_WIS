import * as express from 'express';
import { AppointmentRoutes } from './appointment-routes';
import { AppointmentDetailRoutes } from './appointment-detail-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private appointmentRoutes = new AppointmentRoutes().router;
  private appointmentDetailRoutes = new AppointmentDetailRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/appointment', this.appointmentRoutes);
    this.router.use('/appointment-detail', this.appointmentDetailRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
