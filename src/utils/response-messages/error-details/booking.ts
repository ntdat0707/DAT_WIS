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
  },
  /**
   * Appointment detail not found
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2004(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2004', 'Appointment detail not found', detail);
    return e;
  },
  /**
   * Appointment data not match
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2005(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2005', 'Appointment data not match', detail);
    return e;
  },
  /**
   * Appointment group must has only one primary appointment
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2006(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2006', 'Appointment group must has only one primary appointment', detail);
    return e;
  },
  /**
   * Appointment group not found
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2007(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2007', 'Appointment group not found', detail);
    return e;
  },
  /**
   * Location incorrect
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2008(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2008', 'Location incorrect in appointment', detail);
    return e;
  },
  /**
   * Disallow update customer
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_2009(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('2009', 'Disallow update customer in appointment', detail);
    return e;
  }
};

export { bookingErrorDetails };
