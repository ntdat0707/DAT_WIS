import { ValidationError, ValidationErrorItem } from '@hapi/joi';
import { IErrorDetail } from '../response-messages/index';

function format(error: ValidationError): IErrorDetail[] {
  let errDetail: Array<ValidationErrorItem> = error.details || [];
  let errResponse: IErrorDetail[] = [];
  errDetail.forEach(element => {
    errResponse.push({
      title: element.message,
      source: { pointer: element.path.join('/') },
      code: '000'
    });
  });
  return errResponse;
}

export { format };
