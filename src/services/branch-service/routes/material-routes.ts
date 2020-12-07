import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
require('dotenv').config();

import { MaterialController } from '../controllers/material-controller';

export class MaterialRoutes {
  public router: express.Router = express.Router();
  private materialController = new MaterialController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-all-material', isAuthenticated, this.materialController.getMaterial);
  }
}
