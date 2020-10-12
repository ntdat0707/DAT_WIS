import { ValidationError, ValidationErrorItem } from 'joi';
import { IErrorDetail } from '../response-messages/index';

function format(error: ValidationError): IErrorDetail[] {
  const errDetail: ValidationErrorItem[] = error.details || [];
  const errResponse: IErrorDetail[] = [];
  errDetail.forEach((element) => {
    errResponse.push({
      title: element.message,
      source: { pointer: element.path.join('/') },
      code: '0000'
    });
  });
  return errResponse;
}

export { format };
