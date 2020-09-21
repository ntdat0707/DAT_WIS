import { locationErrorDetails } from './location';
import { resourceErrorDetails } from './resource';
import { serviceErrorDetails } from './service';
import {countryErrorDetails } from './country';
const branchErrorDetails = { ...locationErrorDetails, ...resourceErrorDetails, ...serviceErrorDetails,...countryErrorDetails };

export { branchErrorDetails };
