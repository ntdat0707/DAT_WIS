import { IErrorDetail, isPaginationResult } from '../../../utils/response-messages';
import { IPagination } from '../../../utils/paginator';

interface ISocketErrorMessage {
  isSuccess: false;
  message: {
    errors: IErrorDetail[];
  };
}
interface ISocketSingleSuccessMessage {
  data: object;
}
interface ISocketSuccessMessage {
  isSuccess: true;
  message: ISocketSingleSuccessMessage | Omit<IPagination, '_isPagination'>;
}

/**
 * Build a success message, that will be sent to client
 *
 * @param {object} data
 * @returns {ISingleSuccessMessage | Omit<IPagination, '_isPagination'>}
 */
const buildSocketSuccessMessage = (data: object): ISocketSuccessMessage => {
  if (isPaginationResult(data)) {
    delete data._isPagination;
    return {
      isSuccess: true,
      message: data
    };
  } else {
    return {
      isSuccess: true,
      message: { data }
    };
  }
};
/**
 * Build an error message, that will be sent to client
 *
 * @param {(IErrorDetail | IErrorDetail[])} error
 * @returns {IErrorMessage}
 */
const buildSocketErrorMessage = (error: IErrorDetail | IErrorDetail[]): ISocketErrorMessage => {
  return {
    isSuccess: false,
    message: {
      errors: Array.isArray(error) ? error : [error]
    }
  };
};

export { buildSocketSuccessMessage, buildSocketErrorMessage };
