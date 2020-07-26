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
  }
};

export { customerErrorDetails };
