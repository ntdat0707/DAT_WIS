import * as express from 'express';
import { uploadAsMiddleware } from '../../../utils/file-manager';
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
    this.router.get('/get-all-material', isAuthenticated, this.materialController.getAllMaterial);
    this.router.post(
      '/create-material',
      isAuthenticated,
      uploadAsMiddleware('image'),
      this.materialController.createMaterial
    );
    this.router.post('/create-material', isAuthenticated, this.materialController.createMaterial);
    this.router.delete('/delete-material/:materialId', isAuthenticated, this.materialController.deleteMaterial);
    this.router.put(
      '/update-material/:materialId',
      uploadAsMiddleware('image'),
      isAuthenticated,
      this.materialController.updateMaterial
    );
  }
}
