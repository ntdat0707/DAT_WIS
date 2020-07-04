import express from 'express';

import * as bodyParser from 'body-parser';
import cors from 'cors';
import { mainRoutes } from './routes/index';
require('dotenv').config();

export default class Gateway {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private async config(): Promise<void> {
    // console.log(process.env.SVC_USER_HOST, process.env.SVC_USER_PORT);
    this.app.set('port', process.env.GTW_PORT || 4000);

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use(cors());

    this.app.use('/', mainRoutes);
  }
}
