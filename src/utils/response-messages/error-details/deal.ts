import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const pipelineErrorDetails = {
  E_3101(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3101', 'Pipeline not found', detail);
    return e;
  },
  E_3102(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3102', 'Pipeline exists', detail);
    return e;
  }
};

const pipelineStageErrorDetails = {
  E_3201(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3201', 'Pipeline stage not found', detail);
    return e;
  },
  E_3202(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3202', 'Pipeline stage exists', detail);
    return e;
  },
  E_3203(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3203', 'Old Pipeline stage and move pipeline stage not same pipeline', detail);
    return e;
  }
};

const dealErrorDetails = {
  E_3301(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3301', 'Deal not found', detail);
    return e;
  },
  E_3302(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3302', 'Pipeline is different', detail);
    return e;
  },
  E_3303(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3303', 'Can not reopen deal', detail);
    return e;
  }
};

export { pipelineErrorDetails, pipelineStageErrorDetails, dealErrorDetails };
