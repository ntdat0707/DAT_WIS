import { Mongoose } from 'mongoose';
import { logger } from '../../../utils/logger';
require('dotenv').config();

const mongoURL = 'mongodb://' + process.env.MONGO_HOST + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_NAME;
const options = {
  user: process.env.MONGO_USERNAME,
  pass: process.env.MONGO_PASSWORD,
  useNewUrlParser: true
};
const mongoose = new Mongoose();
mongoose
  .connect(mongoURL, options)
  .then(() => {
    logger.info({
      message: 'Connect to database successfully',
      label: 'MongoDB'
    });
  })
  .catch((error) => {
    logger.info({
      message: 'Connect to database failed' + error,
      label: 'MongoDB'
    });
  });

export default mongoose;
