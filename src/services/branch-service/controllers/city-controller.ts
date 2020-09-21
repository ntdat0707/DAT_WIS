import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { countryCodeSchema } from '../configs/validate-schemas/country';
import { buildSuccessMessage } from '../../../utils/response-messages/responses';
import { CityModel } from '../../../repositories/postgres/models';
import { cityErrorDetails } from '../../../utils/response-messages/error-details/branch/city';
export class CityController {
  /**
   * @swagger
   * /branch/city/get-cities/{countryCode}:
   *   get:
   *     tags:
   *       - Branch
   *     name: getCities
   *     parameters:
   *     - in: path
   *       name: countryCode
   *       schema:
   *          type: string
   *       required: true
   *     responses:
   *       200:
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public getCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = req.params.countryCode;
      const validateErrors = validate(dataInput, countryCodeSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const cities = await CityModel.findAll({ where: { countryCode: dataInput } });
      if (!cities) {
        return next(new CustomError(cityErrorDetails.E_1000('Cities not exists'), HttpStatus.NOT_FOUND));
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(cities));
    } catch (error) {
      return next(error);
    }
  };
}
