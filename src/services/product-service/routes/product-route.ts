import * as express from 'express';
import { uploadAsMiddleware } from '../../../utils/file-manager';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { ProductController } from '../controllers/product-controller';
export class ProductRoutes {
  public router: express.Router = express.Router();
  private productController = new ProductController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post(
      '/upload-image-product',
      uploadAsMiddleware('photo'),
      isAuthenticated,
      this.productController.uploadImageProduct
    );
  }
}
