import * as express from 'express';

import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { StaffController } from '../controllers/staff-controller';
import { uploadAsMiddleware } from '../../../utils/file-manager';
require('dotenv').config();

export class StaffRoutes {
  public router: express.Router = express.Router();
  private staffController = new StaffController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-staff/:staffId?', this.staffController.getStaff);
    this.router.get('/get-staffs', isAuthenticated, this.staffController.getStaffs);
    this.router.post('/create', isAuthenticated, uploadAsMiddleware('avatar'), this.staffController.createStaff);
    this.router.get('/get-all-staffs', isAuthenticated, this.staffController.getAllStaffs);
    this.router.delete('/delete-staff/:staffId?', isAuthenticated, this.staffController.deleteStaff);
    this.router.post('/create-staffs', isAuthenticated, this.staffController.createStaffs);
    this.router.put(
      '/update/:staffId',
      isAuthenticated,
      uploadAsMiddleware('avatar'),
      this.staffController.updateStaff
    );
  }
}
