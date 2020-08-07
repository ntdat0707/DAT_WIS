//Location codes 1000 => 1099 (100 codes)

import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const locationErrorDetails = {
  /**
   * Location is not exists
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1000', 'Location is not exists', detail);
    return e;
  },
  /**
   * User has no permission access to location
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1001', 'Can not access to this location', detail);
    return e;
  }
};

export { locationErrorDetails };
