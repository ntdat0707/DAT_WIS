import * as express from 'express';
require('dotenv').config();
import { EEnvironments } from '../../../utils/consts';
import { serviceRoutes } from './service-routes';
import { docsRoutes } from './docs-route';
import { API_BASE_PATH, DOCS_BASE_PATH } from './configs';
// import { createProxyMiddleware } from 'http-proxy-middleware';

class MainRoutes {
  public router: express.Router = express.Router();
  constructor() {
    // console.log(this.rootDocsPreFix);
    this.config();
  }
  private config(): void {
    if (
      [EEnvironments.DEVELOPMENT as string, EEnvironments.TESTING as string].includes(process.env.NODE_ENV) ||
      ([EEnvironments.STAGING as string, EEnvironments.PRODUCTION as string].includes(process.env.NODE_ENV) &&
        process.env.NODE_NAME === process.env.API_GTW_NAME)
    ) {
      this.router.use(API_BASE_PATH, serviceRoutes);
    }
    if (process.env.IS_EXPOSE_SWAGGER_DOCS && process.env.IS_EXPOSE_SWAGGER_DOCS === 'true')
      this.router.use(DOCS_BASE_PATH, docsRoutes);
  }
}
export const mainRoutes = new MainRoutes().router;
