import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { countryCodeSchema } from '../configs/validate-schemas/country';
import { CountryModel } from '../../../repositories/postgres/models/country-model';
import { countryErrorDetails } from '../../../utils/response-messages/error-details/branch/country';
import { buildSuccessMessage } from '../../../utils/response-messages/responses';
export class CountryController {
  /**
   * @swagger
   * /branch/country/get-country/{countryCode}:
   *   get:
   *     tags:
   *       - Branch
   *     name: getCountry
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
  public getCountry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataInput = req.params.countryCode;
      const validateErrors = validate(dataInput, countryCodeSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const country = await CountryModel.findOne({
        where: { countryCode: dataInput }
      });
      if (!country) {
        return next(new CustomError(countryErrorDetails.E_1000('Country is not exists'), HttpStatus.NOT_FOUND));
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(country));
    } catch (error) {
        return next(error);
    }
  };
}
