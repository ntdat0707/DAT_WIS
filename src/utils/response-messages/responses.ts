// Read more Error object: https://jsonapi.org/format/#error-objects
import { IPagination } from '../paginator';
interface ISourceError {
  pointer?: string;
  parameter?: string;
}

interface IErrorDetail {
  code?: string;
  source?: ISourceError;
  title: string;
  detail?: string;
}

interface IErrorMessage {
  errors: IErrorDetail[];
}

interface ISingleSuccessMessage {
  data: object;
}

function isPaginationResult(data: object): data is IPagination {
  return (data as IPagination)._isPagination !== undefined && (data as IPagination)._isPagination === true;
}

/**
 * Build a success message, that will be sent to client
 *
 * @param {object} data
 * @returns {ISingleSuccessMessage | Omit<IPagination, '_isPagination'>}
 */
const buildSuccessMessage = (data: object): ISingleSuccessMessage | Omit<IPagination, '_isPagination'> => {
  if (isPaginationResult(data)) {
    delete data._isPagination;
    return data;
  } else {
    return { data };
  }
};
/**
 * Build an error message, that will be sent to client
 *
 * @param {(IErrorDetail | IErrorDetail[])} error
 * @returns {IErrorMessage}
 */
const buildErrorMessage = (error: IErrorDetail | IErrorDetail[]): IErrorMessage => {
  if (Array.isArray(error)) return { errors: error };
  else return { errors: [error] };
};

export { buildSuccessMessage, buildErrorMessage, IErrorDetail, ISourceError };
