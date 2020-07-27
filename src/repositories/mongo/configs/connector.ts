import mongoose from 'mongoose';
import { logger } from '../../../utils/logger';
require('dotenv').config();
export default async (): Promise<typeof mongoose> => {
  const mongoURL = 'mongodb://' + process.env.MONGO_HOST + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_NAME;
  var options = {
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD,
    useNewUrlParser: true
  };
  try {
    const rs = await mongoose.connect(mongoURL, options);
    logger.info({
      message: 'Connect to database successfull',
      label: 'MongoDB'
    });
    return rs;
  } catch (error) {
    logger.info({
      message: 'Connect to database failed' + error,
      label: 'MongoDB'
    });
  }
};
