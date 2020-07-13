//100 => 199
import { IErrorDetail } from '../responses';
import { buildErrorDetail } from './index';

const customerErrorDetails = {
  // All order items must same seller
  E_2OO(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('200', 'Email already exists ', detail);
    return e;
  },
  E_2O1(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('201', 'Phone already exists ', detail);
    return e;
  },
  E_2O2(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('202', 'Email not exists ', detail);
    return e;
  },
  E_2O3(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('203', 'Password invalid', detail);
    return e;
  },
  E_2O4(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('204', 'Refresh token invalid', detail);
    return e;
  },
  E_2O5(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('205', 'Refresh token invalid', detail);
    return e;
  },
  E_2O6(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('206', 'Old password invalid', detail);
    return e;
  },

  E_2O7(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('207', 'Only the system account has this function', detail);
    return e;
  },

  E_2O8(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('208', 'Undeliverable messages', detail);
    return e;
  },

  E_2O9(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('209', 'Location invalid', detail);
    return e;
  },

  E_210(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('210', 'Cannot be defaulted', detail);
    return e;
  },
  E_211(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('211', 'Shipping address not found', detail);
    return e;
  },
  E_212(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('212', 'Shipping address is not set by default', detail);
    return e;
  },
  E_213(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('213', 'Activation failed', detail);
    return e;
  }
};

export { customerErrorDetails };
