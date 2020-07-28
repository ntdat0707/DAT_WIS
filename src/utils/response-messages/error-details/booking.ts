//4000 => 4999
import { IErrorDetail } from '../responses';
import { buildErrorDetail } from './index';

const bookingErrorDetails = {
  /**
   * Appointment must has detail
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2000', 'Appointment must has details', detail);
    return e;
  },
  /**
   * Appointment detail not match
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2000', 'Appointment detail not match', detail);
    return e;
  },
  /**
   * Appointment not found
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2002(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2002', 'Appointment not found', detail);
    return e;
  },
  /**
   * Appointment status invalid
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2003(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2003', 'Appointment status invalid', detail);
    return e;
  }
};

export { bookingErrorDetails };
