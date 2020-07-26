import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { handleCustomError, handleException } from '../../utils/error-handlers';
import { mainRoutes } from './routes/index';
require('dotenv').config();

export default class BranchService {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private config() {
    this.app.set('port', process.env.SVC_BRANCH_PORT);

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use(cors());
    // this.app.use(passport.session());
    this.app.use('/', mainRoutes);

    //https://expressjs.com/en/guide/error-handling.html
    this.app.use(handleCustomError);
    this.app.use(handleException);
  }
}
