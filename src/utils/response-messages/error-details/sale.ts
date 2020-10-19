import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const invoiceErrorDetails = {
  E_3300(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3300', 'Invoice not found', detail);
    return e;
  },
  E_3301(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3301', 'Total quatity of invoice is incorrect', detail);
    return e;
  },
  E_3302(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3302', 'SubTotal of invoice is incorrect', detail);
    return e;
  },
  E_3303(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3303', 'Total amount of invoice is incorrect', detail);
    return e;
  },
  E_3304(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3304', 'Appointment existed in invoice', detail);
    return e;
  },
  E_3305(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3305', 'The amount is greater than the balance in the invoice', detail);
    return e;
  }
};

export { invoiceErrorDetails };
