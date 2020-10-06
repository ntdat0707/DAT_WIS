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
  },
  /**
   * Weekday do not allow duplicate value
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1002(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1002', 'Weekday do not allow duplicate value', detail);
    return e;
  },

  /**
   * Location working hour exists
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1003(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1003', 'Location working hour exists', detail);
    return e;
  },

  /**
   * Start time before end time
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1004(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1004', 'Start time before end time', detail);
    return e;
  },

  /**
   * Location Images is not exits
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1006(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1006', 'location Images Ids not exists', detail);
    return e;
  },

  E_1007(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1007', 'location detail is null', detail);
    return e;
  },
};



export { locationErrorDetails };
