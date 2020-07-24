import * as express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { VERSION, API_BASE_PATH } from './configs';

const HOST = process.env.SERVER_HOST;
console.log('HOST============================================', HOST);
// const PORT = process.env.GTW_PORT;

const swaggerDefinition = {
  info: {
    title: 'API Documentation',
    version: `version: ${VERSION}`,
    description: 'Endpoints to test the user registration routes'
  },
  host: HOST,
  // host: `localhost:${PORT}`,
  basePath: API_BASE_PATH,
  securityDefinitions: {
    Bearer: {
      type: 'apiKey',
      name: 'authorization',
      in: 'headers'
    }
  }
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['**/*.ts']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

class DocsRoutes {
  public router: express.Router = express.Router();
  constructor() {
    this.config();
  }
  private config(): void {
    //docs
    this.router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
}
export const docsRoutes = new DocsRoutes().router;
