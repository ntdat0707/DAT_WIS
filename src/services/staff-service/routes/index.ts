import * as express from 'express';
import { StaffRoutes } from './staff-route';

class MainRoutes {
  public router: express.Router = express.Router();
  private staffRoutes = new StaffRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.staffRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
