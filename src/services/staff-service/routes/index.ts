import * as express from 'express';
import { StaffRoutes } from './staff-route';
import { AuthRoutes } from './auth-route';
import { TeamRoutes } from './team-route';
import { RoleRoutes } from './role-route';

class MainRoutes {
  public router: express.Router = express.Router();
  private staffRoutes = new StaffRoutes().router;
  private authRoutes = new AuthRoutes().router;
  private teamRoutes = new TeamRoutes().router;
  private roleRoutes = new RoleRoutes().router;

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/', this.staffRoutes);
    this.router.use('/auth', this.authRoutes);
    this.router.use('/team', this.teamRoutes);
    this.router.use('/role', this.roleRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
