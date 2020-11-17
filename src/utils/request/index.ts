import axios from 'axios';
require('dotenv').config();

interface IHeaders {
  [name: string]: string;
}
interface IRequestOptions {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  data?: any;
  headers?: IHeaders;
  params?: any;
}

interface IResponse {
  status: number;
  headers: IHeaders;
  response: {
    success: boolean;
    data?: any;
    errors?: any;
    message?: string;
    [name: string]: any;
  };
}

const request = async (options: IRequestOptions): Promise<IResponse> => {
  try {
    const rs = await axios(options);
    return {
      status: rs.status,
      headers: rs.headers,
      response: rs.data
    };
  } catch (e) {
    if (e.response) {
      const { status, headers, data } = e.response;
      return {
        status,
        headers,
        response: data
      };
    } else {
      throw e;
    }
  }
};

export { request, IRequestOptions, IHeaders, IResponse };
