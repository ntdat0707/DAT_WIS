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
  E_4OO(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('400', 'Staff not found', detail);
    return e;
  }
};

export { staffErrorDetails };
