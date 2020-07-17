import * as express from 'express';
export class ServiceRoutes {
  public router: express.Router = express.Router();
  constructor() {
    this.config();
  }
  private config(): void {}
}
