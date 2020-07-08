import * as express from 'express';

class MainRoutes {
  public router: express.Router = express.Router();

  constructor() {
    this.config();
  }
  private config(): void {}
}
export const mainRoutes = new MainRoutes().router;
