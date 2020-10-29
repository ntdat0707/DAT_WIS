import { logger } from '../../utils/logger';
import elasticsearch, { ConfigOptions } from 'elasticsearch';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';

const { parsed: env } = dotenv.config();

const elsConfig: ConfigOptions = {
  host: `${env!.ELASTICSEARCH_HOST || 'localhost'}:${env!.ELASTICSEARCH_PORT || 9200}`,
  // auth: {
  //   username: env!.ELASTICSEARCH_USERNAME || '',
  //   password: env!.ELASTICSEARCH_PASSWORD || ''
  // },
  // log: 'trace',
  apiVersion: env!.ELASTICSEARCH_VERSION || '7.7' // use the same version of your Elasticsearch instance
};

const elasticsearchClient = new elasticsearch.Client(elsConfig);

elasticsearchClient.ping(
  {
    requestTimeout: 3 * 60 * 1000
  },
  (error) => {
    if (error) {
      logger.error({
        label: 'Elasticsearch',
        message: `Elasticsearch connect to ${elsConfig.host} failed ${error}`
      });
    } else {
      logger.info({
        label: 'Elasticsearch',
        message: `Elasticsearch connected to ${elsConfig.host}`
      });
    }
  }
);

const esClient = new Client({
  node: 'http://128.199.79.238:9201',
  ssl: { rejectUnauthorized: false }
});

export { elasticsearchClient, esClient };
