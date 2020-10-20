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
    this.router.post('/complete-onboard', isAuthenticated, this.staffController.completeOnboard);
    this.router.post('/get-staffs-multiple-service', this.staffController.getStaffsServices);
    this.router.post('/get-staff-available-time', this.staffController.getStaffAvailableTimeSlots);
    this.router.post('/get-random-available-time', this.staffController.getRandomAvailableTimeSlots);
    this.router.get('/get-group-staff', isAuthenticated, this.staffController.getGroupStaff);
    this.router.get('/get-staff-in-group', isAuthenticated, this.staffController.getStaffInGroup);
    this.router.get('/list-service/:staffId', this.staffController.getServicesByStaff);
  }
}
