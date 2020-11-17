// import { request } from '../../request';k
interface ISMSOptions {
  from: string,
  body: string,
  to: string,
  flash: boolean,
  label: string,
  callback: {
    url: string,
    strategy: string
  },
  ttl: number,
  transcode: boolean,
  urlShortener: {
    urlValidity: string
  },
  restrictions: {
    india: {
      templateId: number,
      entityId: number
    }
  }
}

interface ISMSResponse {
  trackingId: string,
  createdAt: Date,
  from: string,
  to: string,
  body: string,
  status: string,
  label: string,
  bodyAnalysis: {
    characters: number,
    parts: number,
    transcode: {
      message: string,
      parts: string
    },
    unicode: string,
    unsupportedGSMCharacters: string
  },
  flash: string,
  callback: {
    url: string,
    strategy: string
  },
  ttl: number // [1 - 4320]
}

/**
 * Send SMS
 *
 * @param {ISMSOptions} options
 * @returns {Promise<ISMSResponse>}
 */

// Status code:
//   400:
//     400001009: You don't have enough balance to send the SMS.
//     400005000: The sender id is invalid.
//     400000000: Validation Error.
//                A required field is missing.
//                Invalid value of a field.
//   401: You are unauthorized.
//        Invalid access token, maybe has expired.
//   403:
//   	 403000000: Access denied.
//                Your application's access token does not have the right to use SMS service.

const SendSMS = async (options: ISMSOptions): Promise<ISMSResponse> => {
  try {
    const info: any = options;
    return info;
  } catch (error) {
    throw error;
  }
};

export { SendSMS };
