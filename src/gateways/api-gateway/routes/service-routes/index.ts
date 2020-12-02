import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { buildingEnvs } from '../../../../utils/consts';
import {
  customerServiceConfigs,
  staffServiceConfigs,
  branchServiceConfigs,
  bookingServiceConfigs,
  saleServiceConfigs,
  treatmentServiceConfigs
} from './configs';
import { API_BASE_PATH } from '../configs';
import { productServiceConfigs } from './configs/product';

require('dotenv').config();

class ServiceRoutes {
  public router: express.Router = express.Router();
  private nodeName = process.env.NODE_NAME;
  private apiGatewayName = process.env.API_GTW_NAME;

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
    if (originalUrl.startsWith(`${API_BASE_PATH}${saleServiceConfigs.route}`))
      return `${API_BASE_PATH}${saleServiceConfigs.route}`;
    if (originalUrl.startsWith(`${API_BASE_PATH}${treatmentServiceConfigs.route}`))
      return `${API_BASE_PATH}${treatmentServiceConfigs.route}`;
    if (originalUrl.startsWith(`${API_BASE_PATH}${treatmentServiceConfigs.route}`))
      return `${API_BASE_PATH}${productServiceConfigs.route}`;
    else return '';
  };

  constructor() {
    if (buildingEnvs.includes(process.env.NODE_ENV)) {
      this.config();
    } else {
      if (this.nodeName === this.apiGatewayName) this.config();
    }
  }
  private config(): void {
    // CUSTOMER SERVICE
    this.router.use(
      customerServiceConfigs.route,
      createProxyMiddleware({
        ...customerServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    // STAFF SERVICE
    this.router.use(
      staffServiceConfigs.route,
      createProxyMiddleware({
        ...staffServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    // LOCATION SERVICE
    this.router.use(
      branchServiceConfigs.route,
      createProxyMiddleware({
        ...branchServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    //BOOKING SERVICE
    this.router.use(
      bookingServiceConfigs.route,
      createProxyMiddleware({
        ...bookingServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    //SALE SERVICE
    this.router.use(
      saleServiceConfigs.route,
      createProxyMiddleware({
        ...saleServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    //TREATMENT SERVICE
    this.router.use(
      treatmentServiceConfigs.route,
      createProxyMiddleware({
        ...treatmentServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );

    //PRODUCT SERVICE
    this.router.use(
      productServiceConfigs.route,
      createProxyMiddleware({
        ...productServiceConfigs.options,
        ...{ onProxyReq: this.onProxyReq },
        followRedirects: true,
      })
    );
  }
}
export const serviceRoutes = new ServiceRoutes().router;
