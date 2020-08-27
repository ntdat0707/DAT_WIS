import jwt, { TokenExpiredError } from 'jsonwebtoken';
require('dotenv').config();

import { redis, EKeys } from '../../repositories/redis';
import { CustomError } from '../error-handlers';
import { generalErrorDetails } from '../response-messages/error-details';

import {
  ACCESS_TOKEN_PRIVATE_KEY,
  ACCESS_TOKEN_PUBLIC_KEY,
  REFRESH_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PUBLIC_KEY
} from './certificates';

interface IAccessTokenData {
  userId: string;
  userName: string;
  userType: 'staff' | 'customer';
}
interface IRefreshTokenData {
  userId: string;
  userName: string;
  userType: 'staff' | 'customer';
  accessToken: string;
}

const algorithm: jwt.Algorithm = 'RS256';
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

/**
 * Creat an access token and save it to Redis
 *
 * @param {IAcessTokenData} data
 * @returns {Promise<string>}
 */
async function createAccessToken(data: IAccessTokenData): Promise<string> {
  try {
    const signOptions: jwt.SignOptions = {
      expiresIn: parseInt(accessTokenExpiresIn, 10),
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
 * @returns {(Promise<IAccessTokenData | CustomError>)}
 */
async function verifyAccessToken(accessToken: string): Promise<IAccessTokenData | CustomError> {
  try {
    return new Promise((resolve, _reject) => {
      const verifyOptions: jwt.SignOptions = {
        expiresIn: parseInt(accessTokenExpiresIn, 10),
        algorithm
      };
      jwt.verify(
        accessToken,
        ACCESS_TOKEN_PUBLIC_KEY,
        verifyOptions,
        async (err, accessTokenData: IAccessTokenData) => {
          if (err instanceof TokenExpiredError) {
            resolve(new CustomError(generalErrorDetails.E_0007()));
          }
          if (err) return resolve(new CustomError(generalErrorDetails.E_0003()));
          const tokenStoraged = await redis.getData(`${EKeys.ACCESS_TOKEN}-${accessToken}`);
          if (!tokenStoraged) return resolve(new CustomError(generalErrorDetails.E_0003()));
          resolve(accessTokenData);
        }
      );
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
      expiresIn: parseInt(refreshTokenExpiresIn, 10),
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
        expiresIn: parseInt(refreshTokenExpiresIn, 10),
        algorithm
      };
      jwt.verify(
        refreshToken,
        REFRESH_TOKEN_PUBLIC_KEY,
        verifyOptions,
        async (err, refreshTokenData: IRefreshTokenData) => {
          if (err instanceof TokenExpiredError) {
            resolve(new CustomError(generalErrorDetails.E_0008()));
          }
          if (err) return resolve(new CustomError(generalErrorDetails.E_0005()));
          const tokenStoraged = await redis.getData(`${EKeys.REFRESH_TOKEN}-${refreshToken}`);
          if (!tokenStoraged) return resolve(new CustomError(generalErrorDetails.E_0005()));
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
 * @param {string} refreshToken
 * @returns {(Promise<boolean | CustomError>)}
 */
async function destroyTokens(refreshToken: string): Promise<boolean | CustomError> {
  try {
    const refreshTokenData = await verifyRefreshToken(refreshToken);
    if (refreshTokenData instanceof CustomError) return refreshTokenData;
    const refreshTokenStoraged = await redis.getData(`${EKeys.REFRESH_TOKEN}-${refreshToken}`);
    if (!refreshTokenStoraged) return new CustomError(generalErrorDetails.E_0005());
    const accessToken = refreshTokenData.accessToken;
    await redis.deleteData(`${EKeys.ACCESS_TOKEN}-${accessToken}`);
    await redis.deleteData(`${EKeys.REFRESH_TOKEN}-${refreshToken}`);
    return true;
  } catch (error) {
    throw error;
  }
}
export {
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  destroyTokens,
  IAccessTokenData,
  IRefreshTokenData
};
