import { Request, NextFunction, Response } from 'express';
import CustomError from './custom-error';
import { logger } from '../logger';
import { buildErrorMessage } from '../response-messages';

const handleCustomError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    logger.error({ label: err.label, message: JSON.stringify(err.details) });
    return res.status(err.statusCode).send(buildErrorMessage(err.details));
  } else {
    next(err);
  }
};
export default handleCustomError;
