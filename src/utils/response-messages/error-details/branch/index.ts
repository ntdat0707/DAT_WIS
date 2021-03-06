import { locationErrorDetails } from './location';
import { resourceErrorDetails } from './resource';
import { serviceErrorDetails } from './service';
import { searchErrorDetails } from './search';
export * from './material';

const branchErrorDetails = {
  ...locationErrorDetails,
  ...resourceErrorDetails,
  ...serviceErrorDetails,
  ...searchErrorDetails
};

export { branchErrorDetails };
