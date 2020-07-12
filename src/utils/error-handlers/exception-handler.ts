import { Request, NextFunction, Response } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { logger } from '../logger';
import { buildErrorMessage, generalErrorDetails, buildErrorDetail } from '../response-messages';

const handleException = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const e = buildErrorDetail('001', 'Internal server error', err.message || '');
  logger.error({ label: process.env.NODE_NAME || 'Internal Error', message: JSON.stringify(e) });
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_OO1(err)));
};
export default handleException;