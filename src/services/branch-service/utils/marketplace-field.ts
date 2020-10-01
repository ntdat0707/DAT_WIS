import {ETypeMarketPlaceField} from '../../../utils/consts';
import Joi from 'joi';
import {MarketPlaceFieldsModel} from '../../../repositories/postgres/models';

export const parseDatabyField: any = {
   [ETypeMarketPlaceField.NUMBER](value: string) {
      return +value;
   },
   [ETypeMarketPlaceField.STRING](value: string) {
      return value;
   },
   [ETypeMarketPlaceField.BOOLEAN](value: string) {
      if (value.toLowerCase() === 'true') { return true; }
      if (value.toLowerCase() === 'false') { return false; }
      return null;
   }
};

export const validateValuebyField = (marketPlaceField: MarketPlaceFieldsModel): any => {
  return {
   [ETypeMarketPlaceField.NUMBER]: Joi.number().required().label('value'),
   [ETypeMarketPlaceField.STRING]: marketPlaceField.options
      ? Joi.string()
         .valid(...(JSON.parse(marketPlaceField.options) as any[]))
         .required()
         .label('value')
      : Joi.string()
         .required()
         .label('value'),
   [ETypeMarketPlaceField.BOOLEAN]: Joi.boolean().required().label('value')
  };
};


