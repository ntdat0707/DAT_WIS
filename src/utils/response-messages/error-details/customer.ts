//3000 => 3999
import { IErrorDetail } from '../responses';
import { buildErrorDetail } from './index';

const customerErrorDetails = {
  // Customer's email is exisst
  E_3000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3000', 'Email already exists', detail);
    return e;
  },

  E_3001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3001', 'Customer not found', detail);
    return e;
  },

  E_3002(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3002', 'Can not access to this company', detail);
    return e;
  },
  E_3003(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3003', 'Phone already exists', detail);
    return e;
  },
  E_3004(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3004', 'Login info invalid', detail);
    return e;
  },

  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_3005(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3005', 'Incorrect providerId', detail);
    return e;
  },

  /**
   *
   * Login info invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_3006(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3006', 'Incorrect social information', detail);
    return e;
  },

  /**
   *
   * Input invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_3007(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3007', 'Missing email', detail);
    return e;
  },

  /**
   *
   * Favorite invalid
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_3008(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3008', 'Favorite cannot found', detail);
    return e;
  }
};

export { customerErrorDetails };
