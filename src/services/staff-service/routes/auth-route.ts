import * as express from 'express';
import { AuthController } from '../controllers/auth-controller';

export class AuthRoutes {
  public router: express.Router = express.Router();
  private authController = new AuthController();

  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/register-business-account', this.authController.registerBusinessAccount);
    this.router.post('/login', this.authController.login);
  }
}