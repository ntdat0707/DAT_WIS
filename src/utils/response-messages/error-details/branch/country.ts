//Location codes 1000 => 1099 (100 codes)

import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const countryErrorDetails = {
  /**
   * Country is not exists
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1000', 'Country is not exists', detail);
    return e;
  }
};

export { countryErrorDetails };
