import * as Joi from 'joi';
import { format } from './format-error';
import { IErrorDetail } from '../response-messages/index';
import { baseValidateSchemas } from './base-validate-schemas';

function validate(
  data: any,
  schema: Joi.Schema,
  validateOption: Joi.ValidationOptions = { abortEarly: false }
): IErrorDetail[] {
  if (schema) { 
    const { error } = schema.validate(data, validateOption);
    if (error) {
      const e = format(error);
      return e;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
export { validate, baseValidateSchemas };
