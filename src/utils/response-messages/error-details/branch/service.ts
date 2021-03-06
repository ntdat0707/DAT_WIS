//Resource codes 1200 => 1299
import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const serviceErrorDetails = {
  /**
   * Service is not exists
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1200(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1200', 'Service is not exists ', detail);
    return e;
  },
  E_1201(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1201', 'StaffId out of location', detail);
    return e;
  },

  /**
   *
   * Service not found
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1203(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1203', 'Service not found', detail);
    return e;
  },
  E_1204(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1204', 'Service code exist', detail);
    return e;
  },
  E_1205(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1204', 'cateServiceId out of company', detail);
    return e;
  },
  E_1206(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1206', 'serviceImageId not exists', detail);
    return e;
  }
};

export { serviceErrorDetails };
