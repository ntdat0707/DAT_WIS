//4000 => 4999
import { IErrorDetail } from '../responses';
import { buildErrorDetail } from './index';

const staffErrorDetails = {
  /**
   *
   * Staff not found
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4000', 'Staff not found', detail);
    return e;
  },
  /**
   *
   * Staff's email is exist
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4001', 'Staff email is exists', detail);
    return e;
  },

  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4002(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4002', 'Liogin info invalid', detail);
    return e;
  },

  /**
   * Invalid token
   *
   * @param {string} [detail='Invalid token']
   * @param {ISourceError} [source=null]
   * @returns {IErrorDetail}
   */
  E_4004(detail: string = 'Invalid token'): IErrorDetail {
    return buildErrorDetail('4004', 'Unauthorized', detail);
  },

  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4005(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4005', 'Incorrect providerId', detail);
    return e;
  },

  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4006(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4006', 'Incorrect social information', detail);
    return e;
  },

  /**
   *
   * Input invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4007(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4007', 'Missing email', detail);
    return e;
  },
  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_4008(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4008', 'Login info invalid', detail);
    return e;
  }
};

export { staffErrorDetails };
