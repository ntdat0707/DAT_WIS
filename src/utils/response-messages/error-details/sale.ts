import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const invoiceErrorDetails = {
  E_3300(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3300', 'Invoice not found', detail);
    return e;
  }
};

export { invoiceErrorDetails };
