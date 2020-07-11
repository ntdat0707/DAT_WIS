import HttpStatus from 'http-status-codes';
import { IErrorDetail } from '../response-messages';

class CustomError extends Error {
  public details: IErrorDetail | IErrorDetail[];
  public statusCode: number;
  constructor(errorDetails: IErrorDetail | IErrorDetail[], status: number = null) {
    // errors: IErrorDetail;
    super(); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.details = errorDetails;
    this.statusCode = status ? status : HttpStatus.BAD_REQUEST;
  }
}

export default CustomError;
