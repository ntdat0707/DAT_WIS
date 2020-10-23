import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();
import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { branchErrorDetails, bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  AppointmentDetailModel,
  AppointmentModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  StaffModel,
  ServiceModel,
  ResourceModel,
  LocationModel,
  CustomerModel,
  CustomerWisereModel
} from '../../../repositories/postgres/models';

import {
  createAppointmentGroupSchema,
  appointmentGroupIdSchema,
  updateAppointmentGroupSchema
} from '../configs/validate-schemas';
import { BaseController } from './base-controller';
import { FindOptions, Op } from 'sequelize';
export class AppointmentGroupController extends BaseController {
  /**
   * @swagger
   * definitions:
   *   CreateAppointmentInGroup:
   *       required:
   *           - appointmentDetails
   *           - isPrimary
   *       properties:
   *           customerWisereId:
   *               type: string
   *           isPrimary:
   *               type: boolean
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateNewAppointmentGroup:
   *       required:
   *           - locationId
   *           - date
   *           - appointments
   *       properties:
   *           locationId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentInGroup'
   *
   */

  /**
   * @swagger
   * /booking/appointment-group/create:
   *   post:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: createAppointmentGroup
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateNewAppointmentGroup'
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
  public createAppointmentGroup = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        locationId: req.body.locationId,
        date: req.body.date,
        appointments: req.body.appointments
      };
      const validateErrors = validate(data, createAppointmentGroupSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      if (!workingLocationIds.includes(data.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${data.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const verifyAppointmentDetailTask = [];
      let countPrimary = 0;
      for (const apt of data.appointments) {
        if (apt.isPrimary === true) countPrimary++;
        verifyAppointmentDetailTask.push(this.verifyAppointmentDetails(apt.appointmentDetails, data.locationId));
      }
      if (countPrimary !== 1) {
        return next(new CustomError(bookingErrorDetails.E_2006(), HttpStatus.BAD_REQUEST));
      }
      // veriry appointment details
      if (verifyAppointmentDetailTask.length > 0) {
        const verifyAppointmentDetailResults = await Promise.all(verifyAppointmentDetailTask);
        for (const verifyResult of verifyAppointmentDetailResults) {
          if (verifyResult instanceof CustomError) return next(verifyResult);
        }
      }
      const appointmentIds = [];
      const newAppointmentGroupId = uuidv4();
      //create appoinment
      const createAppointmentTasks = [];
      const createAppointmentDetailTasks = [];
      const createAppointmentDetailStaffTasks = [];
      for (const apptData of data.appointments) {
        let appointmentCode = '';
        for (let i = 0; i < 10; i++) {
          const random = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 8);
          const randomCode = random.toUpperCase();
          appointmentCode = randomCode;
          const existAppCode = await AppointmentModel.findOne({
            where: {
              appointmentCode: appointmentCode
            }
          });
          if (!existAppCode) {
            break;
          }
        }
        const newAppointmentId = uuidv4();
        appointmentIds.push(newAppointmentId);
        createAppointmentTasks.push({
          id: newAppointmentId,
          appointmentGroupId: newAppointmentGroupId,
          locationId: data.locationId,
          date: data.date,
          customerWisereId: apptData.customerWisereId ? apptData.customerWisereId : null,
          isPrimary: apptData.isPrimary === true ? true : false,
          appointmentCode: appointmentCode
        });

        //appointment detail data
        for (const apptDetailData of apptData.appointmentDetails) {
          const newAppointmentDetailId = uuidv4();
          createAppointmentDetailTasks.push({
            id: newAppointmentDetailId,
            appointmentId: newAppointmentId,
            serviceId: apptDetailData.serviceId,
            startTime: apptDetailData.startTime,
            resourceId: apptDetailData.resourceId ? apptDetailData.resourceId : null
          });

          // data appointment detail staff
          for (const staffIdData of apptDetailData.staffIds) {
            createAppointmentDetailStaffTasks.push({
              appointmentDetailId: newAppointmentDetailId,
              staffId: staffIdData
            });
          }
        }
      }
      await AppointmentGroupModel.create(
        { id: newAppointmentGroupId, locationId: data.locationId, date: data.date },
        { transaction }
      );
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentModel.bulkCreate(createAppointmentTasks, { transaction });
      await AppointmentDetailModel.bulkCreate(createAppointmentDetailTasks, { transaction });
      await AppointmentDetailStaffModel.bulkCreate(createAppointmentDetailStaffTasks, { transaction });
      await transaction.commit();
      // for (let i = 0; i < appointmentIds.length; i++) {
      //   const options: IRequestOptions = {
      //     url: 'http://localhost:3000/appointment/create-cron-job-auto-update-status',
      //     method: 'post',
      //     headers: {
      //       accept: '*/*',
      //       'Content-Type': 'application/json'
      //     },
      //     data: JSON.stringify({ appointmentId: appointmentIds[i] })
      //   };
      //   await request(options);
      // }
      // const appointmentGroupStoraged = await AppointmentGroupModel.findOne({
      //   where: { id: newAppointmentGroupId },
      //   include: [
      //     { model: LocationModel, as: 'location', required: true },
      //     {
      //       model: AppointmentModel,
      //       as: 'appointments',
      //       required: true,
      //       include: [
      //         {
      //           model: AppointmentDetailModel,
      //           as: 'appointmentDetails',
      //           required: true,
      //           include: [
      //             {
      //               model: StaffModel.scope('safe'),
      //               as: 'staffs',
      //               required: true
      //             },
      //             {
      //               model: ServiceModel,
      //               as: 'service',
      //               required: true
      //             },
      //             {
      //               model: ResourceModel,
      //               as: 'resource'
      //             }
      //           ]
      //         }
      //       ]
      //     }
      //   ]
      // });
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { appointmentGroupId: newAppointmentGroupId },
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
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
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ]
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listAppointmentDetail);
      res.status(HttpStatus.OK).send(buildSuccessMessage(listAppointmentDetail));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };

  /**
   * @swagger
   * /booking/appointment-group/get-appointment-group/{appointmentGroupId}:
   *   get:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: getAppointmentGroup
   *     parameters:
   *     - in: path
   *       name: appointmentGroupId
   *       required: true
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
  public getAppointmentGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.appointmentGroupId, appointmentGroupIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const appointmentGroup = await AppointmentGroupModel.findOne({
        where: { id: req.params.appointmentGroupId, locationId: workingLocationIds },
        include: [
          {
            model: AppointmentModel,
            as: 'appointments',
            required: true,
            include: [
              {
                model: LocationModel,
                as: 'location',
                required: true
              },
              {
                model: CustomerModel,
                as: 'customer'
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
                required: false
              },
              {
                model: AppointmentDetailModel,
                as: 'appointmentDetails',
                include: [
                  {
                    model: ServiceModel,
                    as: 'service',
                    required: true
                  },
                  {
                    model: ResourceModel,
                    as: 'resource'
                  },
                  {
                    model: StaffModel.scope('safe'),
                    as: 'staffs'
                  }
                ]
              }
            ]
          }
        ]
      });
      if (!appointmentGroup) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2002(`Not found appointment-group ${req.params.appointmentGroupId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(appointmentGroup));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateNewAppointmentInGroup:
   *       required:
   *           - appointmentDetails
   *           - isPrimary
   *       properties:
   *           customerWisereId:
   *               type: string
   *           isPrimary:
   *               type: boolean
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */
  /**
   * @swagger
   * definitions:
   *   CreateNewAppointmentDetail:
   *       required:
   *           - serviceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           resourceId:
   *               type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           serviceId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentInGroup:
   *       required:
   *           - isPrimary
   *           - appointmentId
   *       properties:
   *           appointmentId:
   *               type: string
   *           customerWisereId:
   *               type: string
   *           isPrimary:
   *               type: boolean
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */
  /**
   * @swagger
   * definitions:
   *   UpdateAppointmentGroup:
   *       properties:
   *           locationId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           createNewAppointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentInGroup'
   *           updateAppointments:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/UpdateAppointmentInGroup'
   *           deleteAppointments:
   *               type: array
   *               items:
   *                   type: string
   *
   */
  /**
   * @swagger
   * /booking/appointment-group/update/{appointmentGroupId}:
   *   put:
   *     tags:
   *       - Booking
   *     security:
   *       - Bearer: []
   *     name: updateAppointmentGroup
   *     parameters:
   *     - in: path
   *       name: appointmentGroupId
   *       required: true
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/UpdateAppointmentGroup'
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
  public updateAppointmentGroup = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        appointmentGroupId: req.params.appointmentGroupId,
        locationId: req.body.locationId,
        date: req.body.date,
        createNewAppointments: req.body.createNewAppointments,
        updateAppointments: req.body.updateAppointments,
        deleteAppointments: req.body.deleteAppointments
      };
      const validateErrors = validate(data, updateAppointmentGroupSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }
      // const { workingLocationIds } = res.locals.staffPayload;
      // if (!workingLocationIds.includes(data.locationId)) {
      //   return next(
      //     new CustomError(
      //       branchErrorDetails.E_1001(`You can not access to location ${data.locationId}`),
      //       HttpStatus.FORBIDDEN
      //     )
      //   );
      // }
      const updateAppointmentId = [];
      const appointmentIds = [];
      let countPrimary = 0;
      if (data.updateAppointments && data.updateAppointments.length > 0) {
        for (let i = 0; i < data.updateAppointments.length; i++) {
          if (data.updateAppointments[i].isPrimary === true) {
            updateAppointmentId.push(data.updateAppointments[i].appointmentId);
          }
          if (data.deleteAppointments.includes(data.updateAppointments[i].appointmentId)) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2010(`Duplicate appointment id ${data.updateAppointments[i].appointmentId}`),
                HttpStatus.NOT_FOUND
              )
            );
          }
        }
        const countPrimaryInAppointment = await AppointmentModel.count({
          where: {
            appointmentGroupId: data.appointmentGroupId,
            id: { [Op.notIn]: updateAppointmentId },
            isPrimary: true
          }
        });
        countPrimary += countPrimaryInAppointment;
        countPrimary += updateAppointmentId.length;
      } else {
        const countPrimaryInAppointment = await AppointmentModel.count({
          where: {
            appointmentGroupId: data.appointmentGroupId,
            isPrimary: true
          }
        });
        countPrimary += countPrimaryInAppointment;
      }
      if (data.deleteAppointments && data.deleteAppointments.length > 0) {
        const countPrimaryInAppointment = await AppointmentModel.count({
          where: {
            appointmentGroupId: data.appointmentGroupId,
            id: data.deleteAppointments,
            isPrimary: true
          }
        });
        countPrimary -= countPrimaryInAppointment;
      }
      if (data.createNewAppointments && data.createNewAppointments.length > 0) {
        for (const apt of data.createNewAppointments) {
          if (apt.isPrimary === true) countPrimary++;
        }
      }

      if (countPrimary !== 1) {
        return next(new CustomError(bookingErrorDetails.E_2006(), HttpStatus.BAD_REQUEST));
      }
      const appointmentGroup = await AppointmentGroupModel.findOne({
        where: {
          id: data.appointmentGroupId
        }
      });
      if (!appointmentGroup) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2007(`Not found appointment-group ${req.params.appointmentGroupId}`),
            HttpStatus.NOT_FOUND
          )
        );
      }

      if (data.locationId !== appointmentGroup.locationId) {
        return next(
          new CustomError(
            bookingErrorDetails.E_2008(
              `Location ${data.locationId} incorrect in appointment-group ${data.appointmentGroupId}`
            ),
            HttpStatus.BAD_REQUEST
          )
        );
      }
      //update appointment group here
      const appointmentGroupData: any = {
        date: req.body.date
      };
      // start transaction
      transaction = await sequelize.transaction();
      await AppointmentGroupModel.update(appointmentGroupData, {
        where: { id: data.appointmentGroupId },
        transaction
      });
      if (data.createNewAppointments && data.createNewAppointments.length > 0) {
        const verifyAppointmentDetailTask = [];
        for (const apt of data.createNewAppointments) {
          // if (apt.isPrimary === true) countPrimary++;
          verifyAppointmentDetailTask.push(this.verifyAppointmentDetails(apt.appointmentDetails, data.locationId));
        }
        // veriry appointment details
        if (verifyAppointmentDetailTask.length > 0) {
          const verifyAppointmentDetailResults = await Promise.all(verifyAppointmentDetailTask);
          for (const verifyResult of verifyAppointmentDetailResults) {
            if (verifyResult instanceof CustomError) return next(verifyResult);
          }
        }
        //create appoinment
        const createAppointmentTasks = [];
        const createAppointmentDetailTasks = [];
        const createAppointmentDetailStaffTasks = [];
        for (const apptData of data.createNewAppointments) {
          let appointmentCode = '';
          for (let i = 0; i < 10; i++) {
            const random = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 8);
            const randomCode = random.toUpperCase();
            appointmentCode = randomCode;
            const existAppCode = await AppointmentModel.findOne({
              where: {
                appointmentCode: appointmentCode
              }
            });
            if (!existAppCode) {
              break;
            }
          }
          const newAppointmentId = uuidv4();
          appointmentIds.push(newAppointmentId);
          createAppointmentTasks.push({
            id: newAppointmentId,
            appointmentGroupId: data.appointmentGroupId,
            locationId: data.locationId,
            date: data.date,
            customerWisereId: apptData.customerWisereId ? apptData.customerWisereId : null,
            isPrimary: apptData.isPrimary === true ? true : false,
            appointmentCode: appointmentCode
          });

          //appointment detail data
          for (const apptDetailData of apptData.appointmentDetails) {
            const newAppointmentDetailId = uuidv4();
            createAppointmentDetailTasks.push({
              id: newAppointmentDetailId,
              appointmentId: newAppointmentId,
              serviceId: apptDetailData.serviceId,
              startTime: apptDetailData.startTime,
              resourceId: apptDetailData.resourceId ? apptDetailData.resourceId : null
            });

            // data appointment detail staff
            for (const staffIdData of apptDetailData.staffIds) {
              createAppointmentDetailStaffTasks.push({
                appointmentDetailId: newAppointmentDetailId,
                staffId: staffIdData
              });
            }
          }
        }

        await AppointmentModel.bulkCreate(createAppointmentTasks, { transaction });
        await AppointmentDetailModel.bulkCreate(createAppointmentDetailTasks, { transaction });
        await AppointmentDetailStaffModel.bulkCreate(createAppointmentDetailStaffTasks, { transaction });
      }

      if (data.updateAppointments && data.updateAppointments.length > 0) {
        const arrApptCode = [];
        for (let i = 0; i < data.updateAppointments.length; i++) {
          const appointment = await AppointmentModel.findOne({
            where: {
              id: data.updateAppointments[i].appointmentId,
              appointmentGroupId: data.appointmentGroupId
            }
          });

          if (!appointment) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2002(`Appointment ${data.updateAppointments[i].appointmentId} not exist`),
                HttpStatus.NOT_FOUND
              )
            );
          }
          arrApptCode.push(appointment.appointmentCode);
          await AppointmentModel.destroy({
            where: { id: data.updateAppointments[i].appointmentId },
            transaction
          });
          await AppointmentDetailModel.destroy({
            where: { appointmentId: data.updateAppointments[i].appointmentId },
            transaction
          });
          const appointmentDetails = await AppointmentDetailModel.findAll({
            where: {
              appointmentId: data.updateAppointments[i].appointmentId
            }
          });
          const appointmentDetailIds = appointmentDetails.map((appointmentDetail) => appointmentDetail.id);
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: appointmentDetailIds },
            transaction
          });
        }
        const verifyAppointmentDetailTask = [];
        for (const apt of data.updateAppointments) {
          verifyAppointmentDetailTask.push(this.verifyAppointmentDetails(apt.appointmentDetails, data.locationId));
        }
        // veriry appointment details
        if (verifyAppointmentDetailTask.length > 0) {
          const verifyAppointmentDetailResults = await Promise.all(verifyAppointmentDetailTask);
          for (const verifyResult of verifyAppointmentDetailResults) {
            if (verifyResult instanceof CustomError) return next(verifyResult);
          }
        }
        //create appoinment
        const createAppointmentTasks = [];
        const createAppointmentDetailTasks = [];
        const createAppointmentDetailStaffTasks = [];
        let index = 0;
        for (const apptData of data.updateAppointments) {
          const newAppointmentId = uuidv4();
          appointmentIds.push(newAppointmentId);
          createAppointmentTasks.push({
            id: newAppointmentId,
            appointmentGroupId: data.appointmentGroupId,
            locationId: data.locationId,
            date: data.date,
            customerWisereId: apptData.customerWisereId ? apptData.customerWisereId : null,
            isPrimary: apptData.isPrimary === true ? true : false,
            appointmentCode: arrApptCode[index]
          });
          index++;

          //appointment detail data
          for (const apptDetailData of apptData.appointmentDetails) {
            const newAppointmentDetailId = uuidv4();
            createAppointmentDetailTasks.push({
              id: newAppointmentDetailId,
              appointmentId: newAppointmentId,
              serviceId: apptDetailData.serviceId,
              startTime: apptDetailData.startTime,
              resourceId: apptDetailData.resourceId ? apptDetailData.resourceId : null
            });

            // data appointment detail staff
            for (const staffIdData of apptDetailData.staffIds) {
              createAppointmentDetailStaffTasks.push({
                appointmentDetailId: newAppointmentDetailId,
                staffId: staffIdData
              });
            }
          }
        }
        await AppointmentModel.bulkCreate(createAppointmentTasks, { transaction });
        await AppointmentDetailModel.bulkCreate(createAppointmentDetailTasks, { transaction });
        await AppointmentDetailStaffModel.bulkCreate(createAppointmentDetailStaffTasks, { transaction });
      }

      if (data.deleteAppointments && data.deleteAppointments.length > 0) {
        for (let i = 0; i < data.deleteAppointments.length; i++) {
          const appointment = await AppointmentModel.findOne({
            where: {
              id: data.deleteAppointments[i],
              appointmentGroupId: data.appointmentGroupId
            }
          });
          if (!appointment) {
            return next(
              new CustomError(
                bookingErrorDetails.E_2002(`Appointment ${data.deleteAppointments[i]} not exist`),
                HttpStatus.NOT_FOUND
              )
            );
          }
          await AppointmentModel.destroy({
            where: { id: data.deleteAppointments[i] },
            transaction
          });
          await AppointmentDetailModel.destroy({
            where: { appointmentId: data.deleteAppointments[i] },
            transaction
          });

          const appointmentDetails = await AppointmentDetailModel.findAll({
            where: {
              appointmentId: data.deleteAppointments[i]
            }
          });
          const appointmentDetailIds = appointmentDetails.map((appointmentDetail) => appointmentDetail.id);
          await AppointmentDetailStaffModel.destroy({
            where: { appointmentDetailId: appointmentDetailIds },
            transaction
          });
        }
      }
      await transaction.commit();
      // for (let i = 0; i < appointmentIds.length; i++) {
      //   const options: IRequestOptions = {
      //     url: 'http://localhost:3000/appointment/create-cron-job-auto-update-status',
      //     method: 'post',
      //     headers: {
      //       accept: '*/*',
      //       'Content-Type': 'application/json'
      //     },
      //     data: JSON.stringify({ appointmentId: appointmentIds[i] })
      //   };
      //   await request(options);
      // }
      // const appointmentGroupStoraged = await AppointmentGroupModel.findOne({
      //   where: { id: data.appointmentGroupId },
      //   include: [
      //     { model: LocationModel, as: 'location', required: true },
      //     {
      //       model: AppointmentModel,
      //       as: 'appointments',
      //       required: true,
      //       include: [
      //         {
      //           model: AppointmentDetailModel,
      //           as: 'appointmentDetails',
      //           required: true,
      //           include: [
      //             {
      //               model: StaffModel.scope('safe'),
      //               as: 'staffs',
      //               required: true
      //             },
      //             {
      //               model: ServiceModel,
      //               as: 'service',
      //               required: true
      //             },
      //             {
      //               model: ResourceModel,
      //               as: 'resource'
      //             }
      //           ]
      //         }
      //       ]
      //     }
      //   ]
      // });
      const query: FindOptions = {
        include: [
          {
            model: AppointmentModel,
            as: 'appointment',
            required: true,
            where: { appointmentGroupId: data.appointmentGroupId },
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
              },
              {
                model: CustomerWisereModel,
                as: 'customerWisere',
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
            required: false
          },
          {
            model: StaffModel,
            as: 'staffs',
            required: true,
            through: { attributes: [] }
          }
        ]
      };
      const listAppointmentDetail: any = await AppointmentDetailModel.findAll(query);
      await this.pushNotifyLockAppointmentData(listAppointmentDetail);
      res.status(HttpStatus.OK).send(buildSuccessMessage(listAppointmentDetail));
    } catch (error) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  };
}
