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
  E_3903(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3903', 'Diagnostic not found', detail);
    return e;
  },
  E_3904(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3904', 'Diagnosis not found', detail);
    return e;
  }
};

export { treatmentErrorDetails };
