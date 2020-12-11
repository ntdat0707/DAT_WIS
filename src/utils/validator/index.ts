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
    const dataValidate: any = {};
    for (const [key] of (schema as any)._ids._byKey.entries()) {
      dataValidate[key] = data[key];
    }
    const { error } = schema.validate(dataValidate, validateOption);
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
