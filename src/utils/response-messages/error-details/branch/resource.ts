//Resource codes 1100 => 1199
import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const resourceErrorDetails = {
  /**
   * Resource is not exists
   *
   * @param {string} [detail=null]
   * @returns {IErrorDetail}
   */
  E_1100(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1100', 'Resource is not exists ', detail);
    return e;
  }
};

export { resourceErrorDetails };
