import { Request, NextFunction, Response } from 'express';
require('dotenv').config();

import HttpStatus from 'http-status-codes';
import { generalErrorDetails } from '../../response-messages/error-details';
import { buildErrorMessage, buildErrorDetail } from '../../response-messages';
import { logger } from '../../logger';
import { verifyAcessToken } from '../../jwt';
import { CustomError } from '../../error-handlers';
import { StaffModel, CompanyModel } from '../../../repositories/postresql/models';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';

/**
 * Check staff logined
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessTokenBearer = req.headers['authorization'] as string;
    //missing token
    if (!accessTokenBearer) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_002()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_002()));
    }
    //check Bearer
    if (!accessTokenBearer.startsWith('Bearer ')) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_003()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_003()));
    }

    const accessToken = accessTokenBearer.slice(7, accessTokenBearer.length).trimLeft();
    const accessTokenData = await verifyAcessToken(accessToken);
    //Invalid token
    if (accessTokenData instanceof CustomError) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_003()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_003()));
    } else {
      const staff = await StaffModel.scope('safe').findOne({
        where: { id: accessTokenData.userId },
        include: [{ model: CompanyModel, as: 'hasCompany', required: false }]
      });
      if (!staff) {
        logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_003()) });
        return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_003()));
      } else {
        req.body.staffPayload = {
          id: staff.id,
          fullName: staff.fullName,
          isBusinessAccount: staff.isBusinessAccount,
          companyId: (staff as any)['hasCompany']?.id
        };
      }
    }
    next();
  } catch (error) {
    const e = buildErrorDetail('001', 'Internal server error', error.message || '');
    logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_OO1(error)));
  }
};

export { isAuthenticated };
