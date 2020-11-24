import { logger } from '../../utils/logger';
import dotenv from 'dotenv';
import { Client, ClientOptions } from '@elastic/elasticsearch';

const { parsed: env } = dotenv.config();

const elsConfig: ClientOptions = {
  node: `http://${env!.ELASTICSEARCH_HOST || 'localhost'}:${env!.ELASTICSEARCH_PORT || 9200}`,
  auth: {
    username: env!.ELASTICSEARCH_USERNAME || '',
    password: env!.ELASTICSEARCH_PASSWORD || ''
  },
  ssl: { rejectUnauthorized: false }
};

const esClient = new Client(elsConfig);

esClient.ping({}, { requestTimeout: 3 * 60 * 1000 }, (error) => {
  if (error) {
    logger.error({
      label: 'Elasticsearch',
      message: `Elasticsearch connect to ${env!.ELASTICSEARCH_HOST || 'localhost'} failed ${error}`
    });
  } else {
    logger.info({
      label: 'Elasticsearch',
      message: `Elasticsearch connected to ${env!.ELASTICSEARCH_HOST || 'localhost'}`
    });
  }
});

export { esClient };
