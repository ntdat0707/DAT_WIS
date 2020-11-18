import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const medicineErrorDetails = {
  E_3900(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3900', 'Medicine not found', detail);
    return e;
  }
};

export { medicineErrorDetails };
