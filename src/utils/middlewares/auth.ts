import { Request, NextFunction, Response } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { logger } from '../logger';
import { CustomError } from '../error-handlers';
import { generalErrorDetails } from '../response-messages/error-details';
import { buildErrorMessage, buildErrorDetail } from '../response-messages';
import { authenticate as authenticateStaff } from './staff/auth';
import { authenticate as authenticateCustomer } from './customer/auth';
const LOG_LABEL = process.env.NODE_NAME || 'development-mode';
/**
 * Middleware check staff or customer login
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffAuthenticationPayload = await authenticateStaff(req.headers.authorization as string);
    if (staffAuthenticationPayload instanceof CustomError) {
      const customerAuthenticationPayload = await authenticateCustomer(req.headers.authorization as string);
      if (customerAuthenticationPayload instanceof CustomError) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(buildErrorMessage(staffAuthenticationPayload.details || customerAuthenticationPayload.details));
      } else {
        res.locals.customerPayload = customerAuthenticationPayload;
      }
    } else {
      res.locals.staffPayload = staffAuthenticationPayload;
    }

    next();
  } catch (error) {
    const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
    logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_0001(error)));
  }
};

export { isAuthenticated };
