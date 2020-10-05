import Joi from 'joi';
import { StatusPipelineStage } from '../../../../utils/consts';
const createFavorite = Joi.object({
  customerId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .required()
    .label('customerId'),
  locationId: Joi.string()
    .guid({
      version: ['uuidv4']
    })
    .allow(null, '')
    .label('locationId')
});
export { createFavorite };
