import { locationErrorDetails } from './location';
import { resourceErrorDetails } from './resource';
import { serviceErrorDetails } from './service';
import { countryErrorDetails } from './country';
import { cityErrorDetails } from './city';
const branchErrorDetails = {
  ...locationErrorDetails,
  ...resourceErrorDetails,
  ...serviceErrorDetails,
  ...countryErrorDetails,
  ...cityErrorDetails
};

export { branchErrorDetails };
