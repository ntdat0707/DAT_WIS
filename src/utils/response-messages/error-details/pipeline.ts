import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const pipelineErrorDetails = {
  E_3101(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3101', 'Pipeline not found', detail);
    return e;
  }
};

const pipelineStageErrorDetails = {
  E_3102(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3102', 'Pipeline stage not found', detail);
    return e;
  }
}

export { pipelineErrorDetails, pipelineStageErrorDetails };
