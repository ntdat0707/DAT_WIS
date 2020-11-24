import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const treatmentErrorDetails = {
  E_3900(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3900', 'Teeth not found', detail);
    return e;
  },
  E_3901(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3901', 'Total price is incorrect', detail);
    return e;
  },
  E_3902(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3902', 'Treatment not found', detail);
    return e;
  },

  E_3905(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3905', 'Procedure not found', detail);
    return e;
  },
  //Diagnosis and diagnostic

  E_4101(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4101', 'Diagnostic is duplicate', detail);
    return e;
  },
  E_4100(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4100', 'Diagnostic not found', detail);
    return e;
  },
  E_4102(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4102', 'Diagnosis not found', detail);
    return e;
  }
};

export { treatmentErrorDetails };
