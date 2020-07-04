import { Request, NextFunction, Response } from 'express';
import HttpStatus from 'http-status-codes';

import { logger } from '../logger';
import { buildErrorMessage, generalErrorDetails } from '../response-messages';

const handleException = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ label: err.label, message: JSON.stringify(err.details) });
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_OO1(err)));
};
export default handleException;
