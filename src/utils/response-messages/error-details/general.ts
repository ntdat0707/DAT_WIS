import { IErrorDetail, ISourceError } from '../responses';
import { buildErrorDetail } from './index';
import { buildingEnvs } from '../../consts';

const generalErrorDetails = {
  /** Internal server error, detail should be null if you cannot detect error */
  E_0001(error: any = null, detail: string = null): IErrorDetail {
    if (error && buildingEnvs.includes(process.env.NODE_ENV)) {
      //tslint:disable
    //  console.log(error);
    }
    const e = buildErrorDetail('0001', 'Internal server error', detail);
    return e;
  },

  /**
   *
   * Missing access token
   * @param {string} [detail='Missing access token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_0002(detail: string = 'Missing access token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0002', 'Unauthorized', detail, source);
  },

  /**
   * Invalid access token
   *
   * @param {string} [detail='Invalid access token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_0003(detail: string = 'Invalid access token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0003', 'Unauthorized', detail, source);
  },

  /**
   *
   * Missing refresh token
   * @param {string} [detail='Missing refresh token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_0004(detail: string = 'Missing refresh token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0004', 'Unauthorized', detail, source);
  },

  /**
   * Invalid refresh token
   *
   * @param {string} [detail='Invalid refresh token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_0005(detail: string = 'Invalid refresh token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0005', 'Unauthorized', detail, source);
  },

  /**
   * Invalid file extension
   *
   * @param {string} [detail='Invalid refresh token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_0006(detail: string = 'Invalid file extension', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0006', 'Invalid file extension', detail, source);
  },
  E_0007(detail: string = 'Token Expired Error', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0007', 'TokenExpiredError', detail, source);
  },
  E_0008(detail: string = 'RefreshToken Expired Error', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('0008', 'RefreshToken Expired Error', detail, source);
  }
};

export { generalErrorDetails };
