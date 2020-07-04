import { Options } from 'http-proxy-middleware';

const VERSION = process.env.VERSION || 'v1';
const API_BASE_PATH = `/api/${VERSION}`;
const DOCS_BASE_PATH = `/docs/${VERSION}`;

interface IServiceConfigs {
  route: string;
  options: Options;
}

export { VERSION, API_BASE_PATH, DOCS_BASE_PATH, IServiceConfigs };
