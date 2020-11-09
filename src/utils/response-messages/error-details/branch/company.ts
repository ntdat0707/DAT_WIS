//Location codes 1000 => 1099 (100 codes)

import { IErrorDetail } from '../../responses';
import { buildErrorDetail } from '../index';

const companyErrorDetails = {
  E_4000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4000', 'Company not found', detail);
    return e;
  },
  E_4001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4001', 'Company Detail not found', detail);
    return e;
  },
  E_4002(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4002', 'Company can not access', detail);
    return e;
  },
  E_4003(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('4003', 'Company type detail not found', detail);
    return e;
  }
};

export { companyErrorDetails };
