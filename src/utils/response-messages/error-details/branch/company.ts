//Location codes 1000 => 1099 (100 codes)

import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const companyErrorDetails = {
  E_4000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4000', 'Company not found', detail);
    return e;
  }
};

export { companyErrorDetails };
