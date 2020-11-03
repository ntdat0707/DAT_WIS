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
  E_3306(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3306', 'Balance of invoice is incorrect', detail);
    return e;
  },
  E_3307(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3307', 'Invoice log not found', detail);
    return e;
  },
  E_3308(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3308', 'Bad request', detail);
    return e;
  }
};
const receiptErrorDetails = {
  E_3400(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3400', 'Receipt not found', detail);
    return e;
  }
};

const discountErrorDetails = {
  E_3500(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3500', 'Discount not found', detail);
    return e;
  }
};

const paymentErrorDetails = {
  E_3600(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3600', 'This account is not owner account', detail);
    return e;
  },
  E_3601(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3601', 'This payment method is not exist', detail);
    return e;
  }
};

const paymentMethodErrorDetails = {
  E_3700(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3700', 'Payment method not found', detail);
    return e;
  }
};

export {
  invoiceErrorDetails,
  receiptErrorDetails,
  discountErrorDetails,
  paymentErrorDetails,
  paymentMethodErrorDetails
};
