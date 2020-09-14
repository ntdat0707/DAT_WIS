import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  LocationDetailModel
} from '../../../repositories/postgres/models';

import {
  createLocationDetailSchema
} from '../configs/validate-schemas';
import _ from 'lodash';

export class LocationDetailController {
    /**
     * @swagger
     * definitions:
     *   WorkingTimeDetail:
     *       required:
     *           - day
     *           - enabled
     *           - range
     *       properties:
     *           day:
     *               type: string
     *           enabled:
     *               type: boolean
     *           range:
     *               type: array
     *               items:
     *                   type: string
     *
     */
    /**
     * @swagger
     * /branch/location/create-location-detail:
     *   post:
     *     tags:
     *       - Branch
     *     security:
     *       - Bearer: []
     *     name: createLocationDetail
     *     consumes:
     *     - multipart/form-data
     *     parameters:
     *     - in: "formData"
     *       name: "title"
     *       type: string
     *     - in: "formData"
     *       name: "payment"
     *       type: string
     *       enum:
     *          - Cash
     *          - Card
     *          - All
     *     - in: "formData"
     *       name: "parking"
     *       type: string
     *       enum:
     *          - Active
     *          - Inactive
     *     - in: "formData"
     *       name: "rating"
     *       type: number 
     *     - in: "formData"
     *       name: "recoveryRooms"
     *       type: number
     *     - in: "formData"
     *       name: "totalBookings"
     *       type: number
     *     - in: "formData"
     *       name: "gender"
     *       type: number
     *     - in: "formData"
     *       name: "openedAt"
     *       type: string
     *       format: date-time
     *       items:
     *           $ref: '#/definitions/WorkingTimeDetail'
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
    public createLocationDetail = async (req: Request, res: Response, next: NextFunction) => {
      let transaction = null;
      try {
        const data: any = {
            title: req.body.title,
            payment: req.body.payment,
            parking: req.body.parking,
            rating: req.body.rating,
            recoveryRooms: req.body.recoveryRooms ,
            totalBookings:req.body.totalBookings,
            gender:req.body.gender,
            openedAt: req.body.openedAt,
        };
  
        const validateErrors = validate(data, createLocationDetailSchema);
        if (validateErrors) {
          return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
        }
        transaction = await sequelize.transaction();
    let locationDetail =    await LocationDetailModel.create({
        title: data.title,
            payment: data.payment,
            parking: data.parking,
            rating: data.rating,
            recoveryRooms: data.recoveryRooms ,
            totalBookings:data.totalBookings,
            gender:data.gender,
            openedAt: data.openedAt}, { transaction });
        await transaction.commit();
        return res.status(HttpStatus.OK).send(buildSuccessMessage(locationDetail));
      } catch (error) {
        //rollback transaction
        if (transaction) {
          await transaction.rollback();
        }
        return next(error);
      }
    };
}