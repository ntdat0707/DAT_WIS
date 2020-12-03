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
    const e = buildErrorDetail('3903', 'Quotations dental not found', detail);
    return e;
  },
  E_3904(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3904', 'Quotations dental detail not found', detail);
    return e;
  },
  E_3905(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3905', 'Procedure not found', detail);
    return e;
  },
  E_3907(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_3907', 'Labo not found', detail);
    return e;
  },
  E_3908(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_3908', 'Diagnosis not found', detail);
    return e;
  },
  E_3909(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_3909', 'Prescription not found', detail);
    return e;
  },
  E_3910(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_3910', 'Treatment process not found', detail);
    return e;
  },
  E_3911(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_3911', 'Procedures not valid', detail);
    return e;
  },

  // #Medical Document Errors
  E_4100(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4100', 'Medical Document not found', detail);
    return e;
  },
  E_4101(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4101', 'Medical File not found', detail);
    return e;
  },
  E_4102(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_4102', 'File upload not found', detail);
    return e;
  }
};

export { treatmentErrorDetails };
