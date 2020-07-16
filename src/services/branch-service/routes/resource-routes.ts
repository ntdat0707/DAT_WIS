//
import * as express from 'express';

export class ResourceRoutes {
  public router: express.Router = express.Router();
  constructor() {
    this.config();
  }
  private config(): void {}
}
