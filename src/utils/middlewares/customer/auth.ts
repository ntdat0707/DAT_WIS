import { Request, NextFunction, Response } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { logger } from '../../logger';
import { verifyAccessToken } from '../../jwt';
import { CustomError } from '../../error-handlers';
import { generalErrorDetails } from '../../response-messages/error-details';
import { buildErrorMessage, buildErrorDetail } from '../../response-messages';
import { CompanyModel, CustomerModel } from '../../../repositories/postgres/models';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';
interface ICustomerAuthenicationPayload {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
}
/**
 * Middleware check customer login
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerAuthenticationPayload = await authenticate(req.headers.authorization as string);
    if (customerAuthenticationPayload instanceof CustomError) {
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(customerAuthenticationPayload.details));
    }
    res.locals.customerPayload = customerAuthenticationPayload;
    next();
  } catch (error) {
    const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
    logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_0001(error)));
  }
};

/**
 * Check customer logined
 *
 * @param {string} accessTokenBearer
 * @returns {(Promise<ICustomerAuthenicationPayload | CustomError>)}
 */
const authenticate = async (accessTokenBearer: string): Promise<ICustomerAuthenicationPayload | CustomError> => {
  try {
    //missing token
    if (!accessTokenBearer) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0002()) });
      return new CustomError(generalErrorDetails.E_0002());
    }
    //check Bearer
    if (!accessTokenBearer.startsWith('Bearer ')) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
      return new CustomError(generalErrorDetails.E_0003());
    }

    const accessToken = accessTokenBearer.slice(7, accessTokenBearer.length).trimLeft();
    const accessTokenData = await verifyAccessToken(accessToken);
    //Invalid token
    if (accessTokenData instanceof CustomError) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
      return new CustomError(generalErrorDetails.E_0003());
    }
    const customer = await CustomerModel.findOne({
      where: { id: accessTokenData.userId },
      include: [{ model: CompanyModel, as: 'company', required: true }]
    });
    if (!customer) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
      return new CustomError(generalErrorDetails.E_0003());
    }
    const customerAuthenicationPayload: ICustomerAuthenicationPayload = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      companyId: customer.companyId
    };
    return customerAuthenicationPayload;
  } catch (error) {
    throw error;
  }
};

export { isAuthenticated, authenticate };
