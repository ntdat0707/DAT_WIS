import { FavoriteController } from './../controllers/favorite-controller';
import * as express from 'express';

import { isAuthenticated as isAuthenticatedCustomer } from '../../../utils/middlewares/customer/auth';
require('dotenv').config();

export class FavoriteRoutes {
  public router: express.Router = express.Router();
  private favoriteController = new FavoriteController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post('/create-favorite', isAuthenticatedCustomer, this.favoriteController.createFavorite);
    this.router.get('/:customerId/list-favorite', this.favoriteController.listFavorite);
  }
}
