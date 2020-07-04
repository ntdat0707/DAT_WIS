import { ValidationError, ValidationErrorItem } from '@hapi/joi';
import { IErrorDetail } from '../response-messages/index';

function format(error: ValidationError): IErrorDetail[] {
  let errDetail: Array<ValidationErrorItem> = error.details || [];
  let errResponse: IErrorDetail[] = [];
  errDetail.forEach(element => {
    errResponse.push({
      title: element.message,
      source: { parameter: element.path.join('/') }
    });
  });
  return errResponse;
}

export { format };
