import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { buildingEnvs } from '../../../utils/consts';
import { customerServiceConfigs, staffServiceConfigs, branchServiceConfigs, bookingServiceConfigs } from './configs';
import { API_BASE_PATH } from '../configs';

require('dotenv').config();

class ServiceRoutes {
  public router: express.Router = express.Router();
  private nodeName = process.env.NODE_NAME;
  // private gatewayHost = process.env.GTW_HOST;
  private gatewayHost = 'gateway';

  private onProxyReq = (proxyReq: any, req: express.Request, _res: express.Response) => {
    const serviceBasePath = this.getServiceBasePath(req.originalUrl);
    proxyReq.setHeader('x-base-url', req.protocol + '://' + req.get('host') + serviceBasePath); //
    if (!req.body || !Object.keys(req.body).length) {
      return;
    }

    const contentType = proxyReq.getHeader('Content-Type');
    const writeBody = (bodyData: string) => {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    };

    // if (contentType === 'application/json')
    if (contentType.includes('application/json')) {
      writeBody(JSON.stringify(req.body));
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      writeBody(JSON.stringify(req.body));
    }
  };

  private getServiceBasePath = (originalUrl: string): string => {
    if (originalUrl.startsWith(`${API_BASE_PATH}${customerServiceConfigs.route}`))
      return `${API_BASE_PATH}${customerServiceConfigs.route}`;
    if (originalUrl.startsWith(`${API_BASE_PATH}${staffServiceConfigs.route}`))
      return `${API_BASE_PATH}${staffServiceConfigs.route}`;
    if (originalUrl.startsWith(`${API_BASE_PATH}${branchServiceConfigs.route}`))
      return `${API_BASE_PATH}${branchServiceConfigs.route}`;
    if (originalUrl.startsWith(`${API_BASE_PATH}${bookingServiceConfigs.route}`))
      return `${API_BASE_PATH}${bookingServiceConfigs.route}`;
    else return '';
  };

  constructor() {
    if (buildingEnvs.includes(process.env.NODE_ENV)) {
      this.config();
    } else {
      if (this.nodeName === this.gatewayHost) this.config();
    }
  }
  private config(): void {
    // CUSTOMER SERVICE
    this.router.use(
      customerServiceConfigs.route,
      createProxyMiddleware({
        ...customerServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq }
      })
    );

    // STAFF SERVICE
    this.router.use(
      staffServiceConfigs.route,
      createProxyMiddleware({
        ...staffServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq }
      })
    );

    // LOCATION SERVICE
    this.router.use(
      branchServiceConfigs.route,
      createProxyMiddleware({
        ...branchServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq }
      })
    );

    //BOOKING SERVICE
    this.router.use(
      bookingServiceConfigs.route,
      createProxyMiddleware({
        ...bookingServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq }
      })
    );
  }
}
export const serviceRoutes = new ServiceRoutes().router;
