import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { RoleController } from '../controllers/role-controller';

export class RoleRoutes {
  public router: express.Router = express.Router();
  private roleController = new RoleController();

  constructor() {
    this.config();
  }

  private config(): void {
    this.router.post('/create-role', isAuthenticated, this.roleController.createRole);
    this.router.post('/update-role/:roleId', isAuthenticated, this.roleController.updateRole);
    this.router.delete('/delete-role/:roleId', isAuthenticated, this.roleController.deleteRole);
    this.router.get('/get-all-role', isAuthenticated, this.roleController.getAllRole);
  }
}
