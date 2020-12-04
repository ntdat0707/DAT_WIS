import { ClientOpts, RedisClient } from 'redis';
import { createClient } from 'redis';
// import { promisify } from 'util';
import dotenv from 'dotenv';

const { parsed: env } = dotenv.config();

const opts: ClientOpts = {
  host: env!.REDIS_HOST || '127.0.0.1',
  port: parseInt(env!.REDIS_PORT, 10) || 6379,
  password: env!.REDIS_PASSWORD || '',
  tls: process.env.REDIS_TLS === 'true'
};

const redisClient: RedisClient = createClient(opts);
redisClient.on('error', (_err) => {
  // logger.error({
  //   label: 'Redis',
  //   message: `Redis connect to ${opts.host} failed ${_err}`
  // });
  console.log(_err);
});

//
redisClient.on('connect', () => {
  // logger.info({
  //   label: 'Redis',
  //   message: `Redis connected to ${opts.host}`
  // });
  console.log(`Redis connected to ${opts.host}`);
});

export default redisClient;
