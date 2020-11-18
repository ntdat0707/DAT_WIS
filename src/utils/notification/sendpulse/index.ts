import fs from 'fs';
import * as crypto from 'crypto';
import { request, IRequestOptions, IResponse } from '../../request';
import * as sms from './sms';
require('dotenv').config();

interface ISendpulseRequestOptions {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  data?: any;
}

let TOKEN = '';
const TOKEN_STORAGE = process.env.SENDPULSE_TOKEN_STORAGE;

/**
 * MD5
 *
 * @param data
 * @return string
 */
const md5 = (data: any) => {
  const md5sum = crypto.createHash('md5');
  md5sum.update(data);
  return md5sum.digest('hex');
};

/**
 * store token
 *
 * @param token
 */
const storeToken = (token: string) => {
  const hashName = md5(process.env.SENDPULSE_API_USER_ID + '::' + process.env.SENDPULSE_API_SECRET);
  fs.writeFileSync(TOKEN_STORAGE + hashName, token);
};

/**
 * sync token
 *
 * @param token
 */
const syncToken = () => {
  const hashName = md5(process.env.SENDPULSE_API_USER_ID + '::' + process.env.SENDPULSE_API_SECRET);
  if (fs.existsSync(TOKEN_STORAGE + hashName)) {
    TOKEN = fs.readFileSync(TOKEN_STORAGE + hashName, { encoding: 'utf8' });
  } else {
    getToken();
  }
};

/**
 * Get token and store token
 *
 */
const getToken = async () => {
  try {
    const option: IRequestOptions = {
      url: process.env.SENDPULSE_API_URL + '/oauth/access_token',
      method: 'post',
      data: {
        grant_type: 'client_credentials',
        client_id: process.env.SENDPULSE_API_USER_ID,
        client_secret: process.env.SENDPULSE_API_SECRET
      }
    };
    const authRequest: IResponse = await request(option);
    TOKEN = authRequest.response.access_token;
    storeToken(TOKEN);
  } catch (error) {
    throw error;
  }
};

/**
 * Form and send request to API service
 *
 * @param {ISendpulseRequestOptions} options
 */
const sendRequest = async (options: ISendpulseRequestOptions) => {
  try {

    if (!TOKEN) {
      syncToken();
    }

    const optionsRequest: IRequestOptions = {
      url: `${process.env.SENDPULSE_API_URL}/${options.path}`,
      method: options.method || 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + TOKEN
      }
    };
    if (options.data) {
      optionsRequest.data = options.data;
    }

    let req = await request(optionsRequest);
    if (req.status === 401) {
      getToken();
      optionsRequest.headers.Authorization = 'Bearer ' + TOKEN;
      req =  await request(optionsRequest);
    }
  } catch (error) {
    throw error;
  }
};

export {
  getToken,
  sendRequest,
  ISendpulseRequestOptions,
  sms
};

