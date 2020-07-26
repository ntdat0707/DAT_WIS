import Joi from "joi";

import { ELocationStatus } from "../../../../utils/consts";

const createLocationSchema = Joi.object({
  name: Joi.string().required().label("name"),
  phone: Joi.string().required().label("phone"),
  email: Joi.string().email().label("email"),
  status: Joi.string().valid(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE).required().label("status"),
  city: Joi.string().label("city"),
  district: Joi.string().label("district"),
  ward: Joi.string().label("ward"),
  address: Joi.string().label("address"),
  latitude: Joi.number().label("latitude"),
  longitude: Joi.number().label("longitude")
});

export { createLocationSchema };
