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
  /** Invalid image format */
  E_002(detail: string = 'only accept png/jpg/jpeg/gif', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('002', 'Invalid image format', detail, source);
  },

  /**
   * Missing token
   *
   * @param {string} [detail='Missing token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_003(detail: string = 'Missing token', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('003', 'Unauthenticated', detail, source);
  },

  E_004(detail: string = 'Email not found', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('004', 'Email not found', detail, source);
  },

  E_005(detail: string = 'token invalid', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('005', 'Token invalid', detail, source);
  },

  E_006(detail: string = 'Customer not found', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('006', 'Customer not found', detail, source);
  },

  //service
  E_007(detail: string = 'Service not found', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('007', 'Service not found', detail, source);
  },

  E_008(detail: string = 'Account not activated', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('008', 'Account not activated', detail, source);
  },

  E_009(detail: string = 'Permission denied', source: ISourceError = null): IErrorDetail {
    return buildErrorDetail('009', 'Permission denied', detail, source);
  }
};

export { generalErrorDetails };
