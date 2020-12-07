import * as express from 'express';
import { uploadAsMiddleware } from '../../../utils/file-manager';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { CustomFieldController } from '../controllers/custom-field-controller';
export class CustomFieldRoutes {
  public router: express.Router = express.Router();
  private customFieldController = new CustomFieldController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post(
      '/upload-image-product',
      uploadAsMiddleware('photo'),
      isAuthenticated,
      this.customFieldController.uploadImageProduct
    );
  }
}
