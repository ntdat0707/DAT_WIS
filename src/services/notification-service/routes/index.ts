import * as express from 'express';
import { EmailRoutes } from './email-routes';

class MainRoutes {
  public router: express.Router = express.Router();
  private emailRoutes = new EmailRoutes().router;
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.use('/webhook', this.emailRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
