import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { FindOptions, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import {
  branchErrorDetails,
  customerErrorDetails,
  bookingErrorDetails
} from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { EAppointmentStatus, AppointmentStatusRules } from '../../../utils/consts';
import {
  sequelize,
  StaffModel,
  ServiceModel,
  ResourceModel,
  CustomerModel,
  AppointmentDetailModel,
  AppointmentModel,
  LocationModel,
  AppointmentDetailStaffModel
} from '../../../repositories/postgres/models';

import {
  createAppointmentSchema,
  filterAppointmentDetailChema,
  updateAppointmentStatusSchema,
  appointmentCancelReasonSchema
} from '../configs/validate-schemas';
import { IAppointmentDetailInput } from '../configs/interfaces';

export class AppointmentController {
  private verifyAppointmentDetails = async (
    appointmentDetails: IAppointmentDetailInput[],
    locationId: string
  ): Promise<IAppointmentDetailInput[] | CustomError> => {
    try {
      if (!appointmentDetails || appointmentDetails.length < 1)
        return new CustomError(bookingErrorDetails.E_2000(), HttpStatus.BAD_REQUEST);
      const serviceTasks = [];
      const resourceTasks = [];
      const staffTasks = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        serviceTasks.push(
          ServiceModel.findOne({
            // attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('id')), 'id']],
            where: {
              id: appointmentDetails[i].serviceId,
              locationId
            },
            include: [
              {
                model: StaffModel,
                as: 'staffs',
                required: true,
                where: { id: appointmentDetails[i].staffIds },
                through: { attributes: [] }
              },
              {
                model: ResourceModel,
                as: 'resources',
                required: true,
                where: { id: appointmentDetails[i].resourceId },
                through: { attributes: [] }
              }
            ]
          })
        );
        // resource
        resourceTasks.push(
          ResourceModel.findOne({
            where: {
              id: appointmentDetails[i].serviceId,
              locationId
            },
            include: [
              {
                model: ServiceModel,
                as: 'services',
                required: true,
                where: { id: appointmentDetails[i].serviceId }
              }
            ]
          })
        );
        // staff
        staffTasks.push(
          StaffModel.findAll({
            where: { id: appointmentDetails[i].staffIds },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                required: true,
                where: { id: locationId }
              },
              {
                model: ServiceModel,
                as: 'services',
                required: true,
                where: { id: appointmentDetails[i].serviceId }
              }
            ]
          })
        );
      }
      const servicesFind = await Promise.all(serviceTasks);
      const serviceIdsFind: string[] = [];
      servicesFind.forEach((e) => {
        try {
          if (e) serviceIdsFind.push(e.id);
        } catch (error) {
          throw error;
        }
      });
      const serviceIds = [...new Set(serviceIdsFind)];
      const resourcesFind = await Promise.all(resourceTasks);
      const resourceIdsFind: string[] = [];
      resourcesFind.forEach((e) => {
        if (e) resourceIdsFind.push(e.id);
      });
      const resourceIds = [...new Set(resourceIdsFind)];

      const staffsFind = await Promise.all(staffTasks);
      const staffs: StaffModel[][] = [];
      staffsFind.forEach((e) => {
        if (e) staffs.push(e);
      });
      if (
        serviceIds.length !== appointmentDetails.length ||
        resourceIds.length !== appointmentDetails.length ||
        staffs.length !== appointmentDetails.length
      ) {
        return new CustomError(
          bookingErrorDetails.E_2001('service or resource or staff not match'),
          HttpStatus.BAD_REQUEST
        );
      }
      for (let j = 0; j < appointmentDetails.length; j++) {
        const tmpStaffIds: string[] = [];
        staffs[j].forEach((e) => {
          if (e) tmpStaffIds.push(e.id);
        });
        const staffIds = [...new Set(tmpStaffIds)];
        if (staffIds.length !== appointmentDetails[j].staffIds.length) {
          return new CustomError(bookingErrorDetails.E_2001('Staff not match'), HttpStatus.BAD_REQUEST);
        }
      }
      return appointmentDetails;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateAppointmentDetail:
   *       required:
   *           - serviceId
   *           - resourceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           serviceId:
   *               type: string
   *           resourceId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *
   */

  /**
   * @swagger
   * definitions:
   *   CreateAppointment:
   *       required:
   *           - locationId
   *           - date
   *           - appointmentDetails
   *       properties:
   *           locationId:
   *               type: string
   *           customerId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */

  /**
   * @swagger
   * /booking/appointment/create-appointment:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: createAppointment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateAppointment'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server errors
   */
  /**
   *  Steps:
   *    1. Validate format body data
   *    2. Check customer exist
   *    3. Check Servcie, staff, resource match input data
   *    4. create appointment and appoitnment detail
   */
  public createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      // start transaction
      transaction = await sequelize.transaction();
      const dataInput = {
        locationId: req.body.locationId,
        customerId: req.body.customerId,
        date: req.body.date,
        appointmentDetails: req.body.appointmentDetails
      };
      //validate req.body
      const validateErrors = validate(dataInput, createAppointmentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      // Check location
      const { workingLocationIds, companyId } = res.locals.staffPayload;
      if (!workingLocationIds.includes(dataInput.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${dataInput.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }

      if (dataInput.customerId) {
        const customer = await CustomerModel.findOne({ where: { id: dataInput.customerId, companyId } });
        if (!customer) {
          return next(
            new CustomError(
              customerErrorDetails.E_3001(
                `Can not find customer ${dataInput.customerId} in location ${dataInput.locationId}`
              ),
              HttpStatus.BAD_REQUEST
            )
          );
        }
      }
      const appointmentId = uuidv4();
      const appointmentDetails = await this.verifyAppointmentDetails(
        dataInput.appointmentDetails,
        dataInput.locationId
      );
      if (appointmentDetails instanceof CustomError) return next(appointmentDetails);
      //insert appointment here
      const appointmentData = {
        id: appointmentId,
        locationId: dataInput.locationId,
        status: EAppointmentStatus.NEW,
        customerId: dataInput.customerId ? dataInput.customerId : null
      };

      await AppointmentModel.create(appointmentData, { transaction });

      const appointmentDetailData: any[] = [];
      const appointmentDetailStaffData = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        const appointmentDetailId = uuidv4();
        appointmentDetailData.push({
          id: appointmentDetailId,
          appointmentId,
          serviceId: appointmentDetails[i].serviceId,
          resourceId: appointmentDetails[i].resourceId,
          startTime: appointmentDetails[i].startTime
        });
        for (let j = 0; j < appointmentDetails[i].staffIds.length; j++) {
          appointmentDetailStaffData.push({
            appointmentDetailId,
            staffId: appointmentDetails[i].staffIds[j]
          });
        }
      }
      await AppointmentDetailModel.bulkCreate(appointmentDetailData, {
        transaction
      });
      await AppointmentDetailStaffModel.bulkCreate(appointmentDetailStaffData, { transaction });
      const findQuery: FindOptions = {
        where: { id: appointmentId },
        include: [
          {
            model: AppointmentDetailModel,
            as: 'appointmentDetails',
            include: [
              {
                model: ServiceModel,
                as: 'service'
              },
              {
                model: ResourceModel,
                as: 'resource'
              },
              {
                model: StaffModel.scope('safe'),
                as: 'staffs',
                through: { attributes: [] }
              }
            ]
          }
        ],
        transaction
      };
      if (dataInput.customerId)
        findQuery.include.push({
          model: CustomerModel,
          as: 'customer'
        });
      const appointmentStoraged = await AppointmentModel.findOne(findQuery);

      //commit transaction
      await transaction.commit();
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentStoraged));
    } catch (error) {
      //rollback transaction
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment/get-all-appointment-details:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAllAppointmentDetails
   *     parameters:
   *     - in: query
   *       name: locationId
   *       schema:
   *          type: string
   *     - in: query
   *       name: startTime
   *       description: YYY-MM-DD HH:mm:ss
   *       schema:
   *          type: string
   *          format: date-time
   *     - in: query
   *       name: endTime
   *       description: YYY-MM-DD HH:mm:ss
   *       schema:
   *          type: string
   *          format: date-time
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public getAllAppointmentDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conditions = {
        locationId: req.query.locationId,
        startTime: req.query.startTime,
        endTime: req.query.endTime
      };
      const validateErrors = validate(conditions, filterAppointmentDetailChema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(conditions.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${conditions.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const query: FindOptions = {
        where: { id: { [Op.ne]: null } },
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { locationId: conditions.locationId },
            include: [
              {
                model: LocationModel,
                as: 'location',
                required: true
              },
              {
                model: CustomerModel,
                as: 'customer',
                required: false
              }
            ]
          },
          {
            model: ServiceModel,
            as: 'service',
            required: true
          },
          {
            model: ResourceModel,
            as: 'resource',
            required: true
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ]
      };

      let conditionStartTime = {};
      if (conditions.startTime) conditionStartTime = { ...conditionStartTime, ...{ [Op.gte]: conditions.startTime } };
      if (conditions.endTime) conditionStartTime = { ...conditionStartTime, ...{ [Op.lte]: conditions.endTime } };
      if (conditionStartTime.constructor === Object && Object.keys(conditionStartTime).length > 0) {
        query.where = {
          ...query.where,
          ...{ startTime: conditionStartTime }
        };
      }
      const appointmentDetails = await AppointmentDetailModel.findAll(query);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentDetails));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentStatus:
   *       required:
   *           - appointmentId
   *           - status
   *       properties:
   *           appointmentId:
   *               type: string
   *           status:
   *               type: string
   *               enum: [new, confirmed, arrived, in_service, completed, cancel]
   *           cancelReason:
   *               type: string
   *               description: only accept with status cancel
   *
   */
  /**
   * @swagger
   * /booking/appointment/update-appointment-status:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAllAppointmentDetails
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateAppointmentStatus'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requets - input invalid format, header is invalid
   *       403:
   *         description: FORBIDDEN
   *       404:
   *         description: Appointment not found
   *       500:
   *         description: Internal server errors
   */
  public updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { appointmentId: req.body.appointmentId, status: req.body.status };
      const validateErrors = validate(data, updateAppointmentStatusSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointment = await AppointmentModel.findOne({
        where: { id: data.appointmentId, locationId: workingLocationIds }
      });
      if (!appointment) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment ${data.appointmentId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (!workingLocationIds.includes(appointment.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${appointment.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const isValidStatus =
        AppointmentStatusRules[appointment.status as EAppointmentStatus][data.status as EAppointmentStatus];
      if (!isValidStatus) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2003(
              `Can not update appointment status from ${appointment.status} to  ${data.status}`
            ),
            HttpStatus.NOT_FOUND
          )
        );
      }
      if (data.status === EAppointmentStatus.CANCEL) {
        const validateReasonErrors = validate(req.body.cancelReason, appointmentCancelReasonSchema);
        if (validateReasonErrors) {
          return next(new CustomError(validateReasonErrors, HttpStatus.BAD_REQUEST));
        }
        await AppointmentModel.update(
          { status: data.status, cancelReason: req.body.cancelReason },
          { where: { id: data.appointmentId, locationId: workingLocationIds } }
        );
      } else {
        await AppointmentModel.update(
          { status: data.status },
          { where: { id: data.appointmentId, locationId: workingLocationIds } }
        );
      }
      const newAppointmentStatus = await AppointmentModel.findOne({
        where: { id: data.appointmentId, locationId: workingLocationIds }
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(newAppointmentStatus));
    } catch (error) {
      return next(error);
    }
  };
}
