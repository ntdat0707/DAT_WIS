import jwt from 'jsonwebtoken';

import { redis, EKeys } from '../../repositories/redis';
import { CustomError } from '../error-handlers';
import { generalErrorDetails } from '../response-messages/error-details';

import {
  ACCESS_TOKEN_PRIVATE_KEY,
  ACCESS_TOKEN_PUBLIC_KEY
  //   REFRESH_TOKEN_PRIVATE_KEY,
  //   REFRESH_TOKEN_PUBLIC_KEY
} from './certificates';

interface IAcessTokenData {
  userId: string;
  userName: string;
  userType: 'staff' | 'customer';
  refreshToken: string;
}
interface IRefreshTokenData {
  userId: string;
  userName: string;
  userType: 'staff' | 'customer';
}

const algorithm: jwt.Algorithm = 'RS256';
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
const logLabel = 'Auth';

/**
 * Creat an access token and save it to Redis
 *
 * @param {IAcessTokenData} data
 * @returns {Promise<string>}
 */
async function createAccessToken(data: IAcessTokenData): Promise<string> {
  try {
    const signOptions: jwt.SignOptions = {
      expiresIn: accessTokenExpiresIn,
      algorithm
    };
    const token = jwt.sign(data, ACCESS_TOKEN_PRIVATE_KEY, signOptions);
    await redis.setData(`${EKeys.ACCESS_TOKEN}-${token}`, JSON.stringify(data), {
      key: 'EX',
      value: accessTokenExpiresIn
    });
    return token;
  } catch (error) {
    throw error;
  }
}

/**
 * Verify access token
 *
 * @param {string} accessToken
 * @returns {(Promise<IAcessTokenData | CustomError>)}
 */
async function verifyAcessToken(accessToken: string): Promise<IAcessTokenData | CustomError> {
  try {
    return new Promise((resolve, _reject) => {
      const verifyOptions: any = {
        expiresIn: accessTokenExpiresIn,
        algorithm
      };
      jwt.verify(accessToken, ACCESS_TOKEN_PUBLIC_KEY, verifyOptions, async (err, accessTokenData: IAcessTokenData) => {
        if (err) return resolve(new CustomError(generalErrorDetails.E_003(), logLabel));
        const tokenStoraged = await redis.getData(`${EKeys.ACCESS_TOKEN}-${accessToken}`);
        if (!tokenStoraged) return resolve(new CustomError(generalErrorDetails.E_003(), logLabel));
        resolve(accessTokenData);
      });
    });
  } catch (error) {
    throw error;
  }
}
export { createAccessToken, verifyAcessToken };
