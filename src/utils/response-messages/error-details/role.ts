import { buildErrorDetail } from '.';
import { IErrorDetail } from '../responses';

const roleErrorDetails = {
  E_3800(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3800', 'This role has been existed in system', detail);
    return e;
  },
  E_3801(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3801', 'Role not found', detail);
    return e;
  },
  E_3802(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3802', 'Can not edit role name', detail);
    return e;
  },
  E_3803(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3803', 'Can not delete role', detail);
    return e;
  },
  E_3804(detail: string = null): IErrorDetail {
    const e = buildErrorDetail('3804', 'Can not assign role for staff', detail);
    return e;
  }
};

export { roleErrorDetails };
