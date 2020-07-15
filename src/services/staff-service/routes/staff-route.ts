import * as express from 'express';
import { StaffController } from '../controllers/staff-controller';
require('dotenv').config();

export class StaffRoutes {
  public router: express.Router = express.Router();
  private staffController = new StaffController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-staff/:staffId?', this.staffController.getStaff);
    this.router.get('/get-staffs', this.staffController.getStaffs);
    this.router.post('/create', this.staffController.createStaff);
  }
}
