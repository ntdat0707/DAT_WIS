import { IRequestOptions, request } from '../request';
require('dotenv').config();

export const validateGoogleToken = async (token: string) => {
  const checkTokenUrl = process.env.CHECK_TOKEN_GG_URL;
  const options: IRequestOptions = {
    url: `${checkTokenUrl}${token}`,
    method: 'get',
    headers: {
      'User-Agent': 'wisere',
      'Content-Type': 'application/json'
    }
  };
  const socialInfor = await request(options);
  return socialInfor;
};

export const validateFacebookToken = async (id: string, token: string) => {
  const checkTokenUrl = process.env.CHECK_TOKEN_FB_URL.replace('${id}', id);
  const options: IRequestOptions = {
    url: `${checkTokenUrl}${token}`,
    method: 'get',
    headers: {
      'User-Agent': 'wisere',
      'Content-Type': 'application/json'
    }
  };
  const socialInfor = await request(options);
  return socialInfor;
};

export const validateAppleCode = async (code: string, clientSecret: string) => {
  const verifyAppleUrl = process.env.VERIFY_APPLE_URL;
  const appleClientId = process.env.APPLE_CLIENT_ID;
  const options: IRequestOptions = {
    url: verifyAppleUrl,
    method: 'post',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    params: {
      client_id: appleClientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code
    }
  };
  const socialInfor = await request(options);
  return socialInfor;
};
