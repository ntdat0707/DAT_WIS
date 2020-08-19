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
    const e = buildErrorDetail('3000', 'Phone already exists', detail);
    return e;
  }
};

export { customerErrorDetails };
