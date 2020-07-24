import * as express from 'express';
import { AppointmentRoutes } from './appointment-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private appointmentRoutes = new AppointmentRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/appointment', this.appointmentRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
