//100 => 199
import { IErrorDetail } from '../responses';
import { buildErrorDetail } from './index';

const customerErrorDetails = {
  // All order items must same seller
  E_3000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3000', 'Email already exists ', detail);
    return e;
  }
};

export { customerErrorDetails };
