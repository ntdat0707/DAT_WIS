//declare sequelize ts connection
import { Sequelize } from 'sequelize';
import { logger } from '../../../ultils/logger';
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

sequelize
  .authenticate()
  .then(() => {
    logger.info({ label: 'Postgresql', message: 'Database connect' });
  })
  .catch(_err => {
    logger.error({ label: 'Postgresql', message: 'Database cannot connect' });
  });

export default sequelize;
