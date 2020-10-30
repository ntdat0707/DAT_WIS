import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const teamErrorDetails = {
  E_5000(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5000', 'Invoice not found', detail);
    return e;
  }
  //   E_5001(detail: string = null): IErrorDetail {
  //     const e = buildErrorDetail('3301', 'Total quatity of invoice is incorrect', detail);
  //     return e;
  //   },
  //   E_5002(detail: string = null): IErrorDetail {
  //     const e = buildErrorDetail('3302', 'SubTotal of invoice is incorrect', detail);
  //     return e;
  //   },
  //   E_5003(detail: string = null): IErrorDetail {
  //     const e = buildErrorDetail('3303', 'Total amount of invoice is incorrect', detail);
  //     return e;
  //   },
  //   E_5004(detail: string = null): IErrorDetail {
  //     const e = buildErrorDetail('3304', 'Appointment existed in invoice', detail);
  //     return e;
  //   },
};
const teamStaffErrorDetails = {
  E_5100(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('E_5100', 'Staff not found in this team', detail);
    return e;
  }
};

export { teamErrorDetails, teamStaffErrorDetails };
