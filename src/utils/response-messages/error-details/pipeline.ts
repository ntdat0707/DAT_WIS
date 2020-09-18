import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const pipelineErrorDetails = {
  E_3101(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3001', 'Customer not found', detail);
    return e;
  }
};

export { pipelineErrorDetails };
