import Joi from '@hapi/joi';
import { format } from './format-error';
import { IErrorDetail } from '../response-messages/index';
import { baseValidateSchemas } from './base-valdiate-schemas';
function validate(
  req: any,
  schema: Joi.SchemaLike,
  validateOption: Joi.ValidationOptions = { abortEarly: false }
): IErrorDetail[] {
  if (schema) {
    const { error } = Joi.validate(req, schema || {}, validateOption);
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
