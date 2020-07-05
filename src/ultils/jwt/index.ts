import jwt from 'jsonwebtoken';

import { redis, EKeys } from '../../repositories/redis';
import { CustomError } from '../error-handlers';
import { generalErrorDetails } from '../response-messages/error-details';

import {
  ACCESS_TOKEN_PRIVATE_KEY,
  ACCESS_TOKEN_PUBLIC_KEY,
  REFRESH_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PUBLIC_KEY
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
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;
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
      const verifyOptions: jwt.SignOptions = {
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

/**
 * Create a refresh token and store it to Redis
 *
 * @param {IRefreshTokenData} data
 * @returns {Promise<string>}
 */
async function createRefreshToken(data: IRefreshTokenData): Promise<string> {
  try {
    const signOptions: jwt.SignOptions = {
      expiresIn: refreshTokenExpiresIn,
      algorithm
    };
    const token = jwt.sign(data, REFRESH_TOKEN_PRIVATE_KEY, signOptions);
    await redis.setData(`${EKeys.REFRESH_TOKEN}-${token}`, JSON.stringify(data), {
      key: 'EX',
      value: refreshTokenExpiresIn
    });
    return token;
  } catch (error) {
    throw error;
  }
}

/**
 * Verify refresh token
 *
 * @param {string} refreshToken
 * @returns {(Promise<IRefreshTokenData | CustomError>)}
 */
async function verifyRefreshToken(refreshToken: string): Promise<IRefreshTokenData | CustomError> {
  try {
    return new Promise((resolve, _reject) => {
      const verifyOptions: jwt.SignOptions = {
        expiresIn: refreshTokenExpiresIn,
        algorithm
      };
      jwt.verify(
        refreshToken,
        REFRESH_TOKEN_PUBLIC_KEY,
        verifyOptions,
        async (err, refreshTokenData: IRefreshTokenData) => {
          if (err) return resolve(new CustomError(generalErrorDetails.E_005(), logLabel));
          const tokenStoraged = await redis.getData(`${EKeys.REFRESH_TOKEN}-${refreshToken}`);
          if (!tokenStoraged) return resolve(new CustomError(generalErrorDetails.E_005(), logLabel));
          resolve(refreshTokenData);
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Destroy access token and refresh token
 *
 * @param {string} accessToken
 * @returns {(Promise<boolean | CustomError>)}
 */
async function destroyTokens(accessToken: string): Promise<boolean | CustomError> {
  try {
    const accessTokenData = await verifyAcessToken(accessToken);
    if (accessTokenData instanceof CustomError) return accessTokenData;
    const accessTokenStoraged = await redis.getData(`${EKeys.ACCESS_TOKEN}-${accessToken}`);
    if (!accessTokenStoraged) return new CustomError(generalErrorDetails.E_003(), logLabel);
    const refreshToken = accessTokenStoraged.refreshToken;
    await redis.deleteData(`${EKeys.REFRESH_TOKEN}-${refreshToken}`);
    await redis.deleteData(`${EKeys.ACCESS_TOKEN}-${accessToken}`);
    return true;
  } catch (error) {
    throw error;
  }
}
export { createAccessToken, verifyAcessToken, createRefreshToken, verifyRefreshToken, destroyTokens };
