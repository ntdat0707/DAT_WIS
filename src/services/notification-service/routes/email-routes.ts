import * as express from 'express';
import { EmailController } from '../controllers/email-controller';
require('dotenv').config();

export class EmailRoutes {
  public router: express.Router = express.Router();
  private emailController = new EmailController();
  constructor() {
    this.config();
  }

  private config(): void {
    this.router.post('/', this.emailController.webhooks);
  }
}
