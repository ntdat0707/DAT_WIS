import { IRequestOptions, request } from '../request';

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
