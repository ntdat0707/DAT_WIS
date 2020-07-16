import { locationErrorDetails } from './location';
import { resourceErrorDetails } from './resource';
import { serviceErrorDetails } from './service';

const branchErrorDetails = { ...locationErrorDetails, ...resourceErrorDetails, ...serviceErrorDetails };

export { branchErrorDetails };
