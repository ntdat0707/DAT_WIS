import { Request, NextFunction, Response } from 'express';
require('dotenv').config();

import HttpStatus from 'http-status-codes';
import { generalErrorDetails } from '../../response-messages/error-details';
import { buildErrorMessage, buildErrorDetail } from '../../response-messages';
import { logger } from '../../logger';
import { verifyAccessToken } from '../../jwt';
import { CustomError } from '../../error-handlers';
import { StaffModel, CompanyModel, LocationModel, CompanyDetailModel } from '../../../repositories/postgres/models';

const LOG_LABEL = process.env.NODE_NAME || 'development-mode';

interface IStaffAuthenticationPayload {
  id: string;
  firstName: string;
  lastName: string;
  isBusinessAccount: boolean;
  companyId: string;
  workingLocationIds: string[];
}

/**
 * get working branches  of staff.
 *
 * @param {string} companyId
 * @param {string} staffId
 * @param {boolean} isOwner
 * @returns
 */
const getWorkingLocations = async (companyId: string, staffId: string, isOwner: boolean) => {
  try {
    if (isOwner === true) {
      const locations = await LocationModel.findAll({ where: { companyId } });
      return locations;
    } else {
      const locations = await LocationModel.findAll({
        include: [
          {
            model: StaffModel,
            required: true,
            where: { id: staffId },
            through: { attributes: [], where: { staffId } }
          }
        ]
      });
      return locations;
    }
  } catch (error) {
    throw error;
  }
};

const getCompany = async (staffId: string) => {
  try {
    let company:any = await CompanyModel.findOne({
      include: [
        {
          model: LocationModel,
          as: 'locations',
          required: true,
          include: [
            {
              model: StaffModel,
              as: 'staffs',
              required: true,
              where: { id: staffId },
              through: { attributes: [], where: { staffId } }
            }
          ]
        },
        {
          model: CompanyDetailModel,
          as: 'companyDetail',
          required: false,
          attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] }
        }
      ]
    });

    if (company && company.companyDetail) {
      company = {
        ...company.dataValues,
        ...company.companyDetail?.dataValues,
        companyDetail: undefined
      };
    }

    return company;
  } catch (error) {
    throw error;
  }
};

/**
 * Check staff logined
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
/*
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessTokenBearer = req.headers.authorization as string;
    //missing token
    if (!accessTokenBearer) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0002()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_0002()));
    }
    //check Bearer
    if (!accessTokenBearer.startsWith('Bearer ')) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_0003()));
    }

    const accessToken = accessTokenBearer.slice(7, accessTokenBearer.length).trimLeft();
    const accessTokenData = await verifyAccessToken(accessToken);
    //Invalid token
    if (accessTokenData instanceof CustomError) {
      logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_0003()));
    } else {
      const staff = await StaffModel.scope('safe').findOne({
        where: { id: accessTokenData.userId },
        include: [{ model: CompanyModel, as: 'hasCompany', required: false }]
      });
      if (!staff) {
        logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
        return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(generalErrorDetails.E_0003()));
      } else {
        const staffPayload: any = {
          id: staff.id,
          fullName: staff.fullName,
          isBusinessAccount: staff.isBusinessAccount
        };

        //companyId
        let companyId = null;
        if ((staff as any).hasCompany && (staff as any).hasCompany.id) {
          companyId = (staff as any).hasCompany.id;
        } else {
          const company = await getCompany(staff.id);
          companyId = company.id;
        }

        staffPayload.companyId = companyId;

        // working location ids
        const workingLocations = await getWorkingLocations(companyId, staffPayload.id, staffPayload.isBusinessAccount);
        const workingLocationIds = workingLocations.map((location) => location.id);
        staffPayload.workingLocationIds = workingLocationIds;

        res.locals.staffPayload = staffPayload;
      }
    }
    next();
  } catch (error) {
    const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
    logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_0001(error)));
  }
};
*/

/**
 * Middleware check staff logined
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffAuthenticationPayload = await authenticate(req.headers.authorization as string);
    if (staffAuthenticationPayload instanceof CustomError) {
      return res.status(HttpStatus.UNAUTHORIZED).send(buildErrorMessage(staffAuthenticationPayload.details));
    }
    res.locals.staffPayload = staffAuthenticationPayload;
    next();
  } catch (error) {
    const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
    logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_0001(error)));
  }
};

/**
 * Check staff logined
 *
 * @param {string} accessTokenBearer
 * @returns {(Promise<IStaffAuthenticationPayload | CustomError>)}
 */
const authenticate = async (accessTokenBearer: string): Promise<IStaffAuthenticationPayload | CustomError> => {
  try {
    let staffAuthenticationPayload: IStaffAuthenticationPayload;
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
      return accessTokenData;
    } else {
      const staff = await StaffModel.scope('safe').findOne({
        where: { id: accessTokenData.userId },
        include: [{ model: CompanyModel, as: 'hasCompany', required: false }]
      });
      if (!staff) {
        logger.error({ label: LOG_LABEL, message: JSON.stringify(generalErrorDetails.E_0003()) });
        return new CustomError(generalErrorDetails.E_0003());
      } else {
        const staffPayload: any = {
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          isBusinessAccount: staff.isBusinessAccount
        };

        //companyId
        let companyId = null;
        if ((staff as any).hasCompany && (staff as any).hasCompany.id) {
          companyId = (staff as any).hasCompany.id;
        } else {
          console.log('AUTHEN: STAFFID', staff.id);
          const company = await getCompany(staff.id);
          companyId = company.id;
        }

        staffPayload.companyId = companyId;

        // working location ids
        const workingLocations = await getWorkingLocations(companyId, staffPayload.id, staffPayload.isBusinessAccount);
        const workingLocationIds = workingLocations.map((location) => location.id);
        staffPayload.workingLocationIds = workingLocationIds;

        staffAuthenticationPayload = staffPayload;
      }
    }
    return staffAuthenticationPayload;
  } catch (error) {
    throw error;
  }
};

export { isAuthenticated, authenticate };
