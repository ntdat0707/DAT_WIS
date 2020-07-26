//declare sequelize ts connection
import { Sequelize } from 'sequelize';
import { logger } from '../../../utils/logger';
require('dotenv').config();
const sequelize = new Sequelize(
  process.env.POSTGRESQL_NAME,
  process.env.POSTGRESQL_USERNAME,
  process.env.POSTGRESQL_PASSWORD,
  {
    host: process.env.POSTGRESQL_HOST,
    port: parseInt(process.env.POSTGRESQL_PORT, 10),
    dialect: 'postgres',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
    dialectOptions: {
      ssl: {
        require: process.env.POSTGRESQL_TLS === 'true',
        rejectUnauthorized: false,
      },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    logger.info({ label: 'Postgresql', message: 'Database connect' });
  })
  .catch((_err) => {
    logger.error({ label: 'Postgresql', message: 'Database cannot connect' + _err });
  });

export default sequelize;
