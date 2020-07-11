import { Request, NextFunction, Response } from 'express';
require('dotenv').config();
import CustomError from './custom-error';
import { logger } from '../logger';
import { buildErrorMessage } from '../response-messages';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';

const handleCustomError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    logger.error({ label: LOG_LABEL, message: JSON.stringify(err.details) });
    return res.status(err.statusCode).send(buildErrorMessage(err.details));
  } else {
    next(err);
  }
};
export default handleCustomError;
