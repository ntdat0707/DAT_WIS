import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const materialErrorDetails = {
  E_1300(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1300', 'Material Image not found', detail);
    return e;
  },
  E_1301(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('1301', 'Material code already exists', detail);
    return e;
  }
};

export { materialErrorDetails };
