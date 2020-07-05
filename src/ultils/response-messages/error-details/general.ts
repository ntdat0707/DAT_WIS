import { IErrorDetail, ISourceError } from '../responses';
import { buildErrorDetail } from './index';
import { buildingEnvs } from '../../consts';

const generalErrorDetails = {
  /** Internal server error, detail should be null if you cannot detect error */
  E_OO1(error: any = null, detail: string = null): IErrorDetail {
    if (error && buildingEnvs.includes(process.env.NODE_ENV)) {
      console.log(error);
    }
    const e = buildErrorDetail('001', 'Internal server error', detail);
    return e;
  },

  /**
   *
   * Missing access token
   * @param {string} [detail='Missing access token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_002(detail: string = 'Missing access token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('002', 'Unauthorized', detail, source);
  },

  /**
   * Invalid access token
   *
   * @param {string} [detail='Invalid access token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_003(detail: string = 'Invalid access token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('003', 'Unauthorized', detail, source);
  },

  /**
   *
   * Missing refresh token
   * @param {string} [detail='Missing refresh token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_004(detail: string = 'Missing refresh token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('004', 'Unauthorized', detail, source);
  },

  /**
   * Invalid refresh token
   *
   * @param {string} [detail='Invalid refresh token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_005(detail: string = 'Invalid refresh token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('005', 'Unauthorized', detail, source);
  }
};

export { generalErrorDetails };
