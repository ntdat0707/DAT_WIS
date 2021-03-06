import { IErrorDetail, ISourceError } from '../responses';
import { generalErrorDetails } from './general';
import { customerErrorDetails } from './customer';
import { staffErrorDetails } from './staff';
import { branchErrorDetails } from './branch';
import { bookingErrorDetails } from './booking';
import { pipelineErrorDetails, pipelineStageErrorDetails, dealErrorDetails } from './deal';
import { invoiceErrorDetails, receiptErrorDetails, discountErrorDetails } from './sale';
import { teamErrorDetails, teamStaffErrorDetails, teamSubErrorDetails } from './team';
import { roleErrorDetails } from './role';
import { treatmentErrorDetails } from './treatment';

const buildErrorDetail = (
  code: string,
  title: string,
  detail: string = null,
  source: ISourceError = null
): IErrorDetail => {
  const e: IErrorDetail = {
    code,
    title
  };
  if (detail) e.detail = detail;
  if (source && (source.parameter || source.pointer)) e.source = source;
  return e;
};

export {
  buildErrorDetail,
  generalErrorDetails,
  customerErrorDetails,
  staffErrorDetails,
  branchErrorDetails,
  bookingErrorDetails,
  pipelineErrorDetails,
  pipelineStageErrorDetails,
  dealErrorDetails,
  invoiceErrorDetails,
  receiptErrorDetails,
  discountErrorDetails,
  teamErrorDetails,
  teamStaffErrorDetails,
  teamSubErrorDetails,
  roleErrorDetails,
  treatmentErrorDetails
};
