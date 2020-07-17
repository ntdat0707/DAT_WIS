//100 => 199
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
  }
};

export { staffErrorDetails };
