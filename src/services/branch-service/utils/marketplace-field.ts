import { ETypeMarketPlaceField } from '../../../utils/consts';
import Joi from 'joi';
import { MarketPlaceFieldsModel } from '../../../repositories/postgres/models';

export const parseDataByType: any = {
  [ETypeMarketPlaceField.NUMBER](value: string) {
    return +value;
  },
  [ETypeMarketPlaceField.STRING](value: string) {
    return value;
  },
  [ETypeMarketPlaceField.BOOLEAN](value: string) {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
    return null;
  },
  undefined: (): null => null,
  '': (): null => null
};

export const dataDefaultByType: any = {
  [ETypeMarketPlaceField.NUMBER]: '0',
  [ETypeMarketPlaceField.STRING]: '',
  [ETypeMarketPlaceField.BOOLEAN]: 'false'
};

export const validateValueByType = (marketPlaceField: MarketPlaceFieldsModel): any => {
  return {
    [ETypeMarketPlaceField.NUMBER]: Joi.number().required().label('value'),
    [ETypeMarketPlaceField.STRING]: marketPlaceField.options
      ? Joi.string()
          .valid(...(JSON.parse(marketPlaceField.options) as any[]))
          .required()
          .label('value')
      : Joi.string().required().label('value'),
    [ETypeMarketPlaceField.BOOLEAN]: Joi.boolean().required().label('value')
  };
};

