import { writelog } from './controllers/log-controller';
import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { handleCustomError, handleException } from '../../utils/error-handlers';
require('dotenv').config();

export default class SystemService {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private async config(): Promise<void> {
    // this.app.set('port', process.env.SVC_SYSTEM_PORT);

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use(cors());
    // this.app.use(passport.session());
    await writelog();

    //https://expressjs.com/en/guide/error-handling.html
    this.app.use(handleCustomError);
    this.app.use(handleException);
  }
}
