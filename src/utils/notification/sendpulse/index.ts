import { request, IRequestOptions, IResponse } from '../../request';

require('dotenv').config();

let TOKEN = '';

/**
 * Get token
 *
 * @param
 */
const getToken = async () => {
  try {
    const option: IRequestOptions = {
      url: process.env.SENDPULSE_URL + 'oauth/access_token',
      method: 'post',
      data: {
        grant_type: 'client_credentials',
        client_id: process.env.SENDPULSE_API_USER_ID,
        client_secret: process.env.SENDPULSE_API_SECRET
      }
    };
    const authRequest: IResponse = await request(option);
    TOKEN = authRequest.response.data.access_token;
    console.log(TOKEN);
  } catch (error) {
    throw error;
  }
};

export { getToken };
