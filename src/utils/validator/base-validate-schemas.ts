import Joi from 'joi';
import { ELocales } from '../consts';

const baseValidateSchemas = {
  paginateOption: Joi.object({
    pageNum: Joi.number()
      .integer()
      .min(1)
      .required()
      .label('pageNum'),
    pageSize: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .required()
      .label('pageSize')
  }),
  localeSchema: Joi.string()
    .valid(ELocales.VIETNAMESE, ELocales.ENGLISH)
    .required()
    .label('locale'),

  slugSchema: Joi.string()
    .required()
    .label('slug')
};

export { baseValidateSchemas };
