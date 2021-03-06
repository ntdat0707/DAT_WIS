import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const teamErrorDetails = {
  E_5000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5000', 'Invoice not found', detail);
    return e;
  },
  E_5001(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5001', 'This team is not exist', detail);
    return e;
  }
};
const teamStaffErrorDetails = {
  E_5100(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5100', 'Staff not found in this team', detail);
    return e;
  }
};

const teamSubErrorDetails = {
  E_5200(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5200', 'This team already has parent', detail);
    return e;
  }
};

export { teamErrorDetails, teamStaffErrorDetails, teamSubErrorDetails };
