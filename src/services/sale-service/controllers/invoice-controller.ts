import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createInvoiceSchema, createPaymentSchema, appointmentId } from '../configs/validate-schemas';
import {
  AppointmentDetailModel,
  AppointmentModel,
  CustomerWisereModel,
  InvoiceDetailModel,
  InvoiceDetailStaffModel,
  InvoiceModel,
  LocationModel,
  PaymentModel,
  sequelize,
  ServiceModel,
  StaffModel
} from '../../../repositories/postgres/models';
import {
  bookingErrorDetails,
  branchErrorDetails,
  customerErrorDetails,
  invoiceErrorDetails,
  staffErrorDetails
} from '../../../utils/response-messages/error-details/';
import { EBalanceType } from './../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { FindOptions } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { deleteInvoiceDetailSchema, deleteInvoiceSchema } from '../configs/validate-schemas/invoice';
import HttpStatus from 'http-status-codes';
export class InvoiceController {
  /**
   * @swagger
   * definitions:
   *   listInvoiceDetail:
   *       properties:
   *           serviceId:
   *               type: string
   *           unit:
   *               type: string
   *           quantity:
   *               type: integer
   *           listStaff:
   *               type: array
   *               items:
   *                   properties:
   *                       staffId:
   *                           type: string
   *
   */
  /**
   * @swagger
   * definitions:
   *   invoiceCreate:
   *       properties:
   *           locationId:
   *               type: string
   *           appointmentId:
   *               type: string
   *           customerWisereId:
   *               type: string
   *           source:
   *               type: string
   *           note:
   *               type: string
   *           discount:
   *               type: number
   *           tax:
   *               type: number
   *           listInvoiceDetail:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/listInvoiceDetail'
   *
   */

  /**
   * @swagger
   * /sale/checkout:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: checkout
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/invoiceCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */

  public checkout = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      transaction = await sequelize.transaction();
      const { workingLocationIds } = res.locals.staffPayload;
      let validateErrors: any;
      if (!req.body.appointmentId) {
        validateErrors = validate(req.body, createInvoiceSchema);
        if (validateErrors) {
          return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
        }
        if (!workingLocationIds.includes(req.body.locationId)) {
          throw new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
            httpStatus.FORBIDDEN
          );
        }
        const customerWisere = await CustomerWisereModel.findOne({ where: { id: req.body.customerWisereId } });
        if (!customerWisere) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${req.body.customerWisereId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        await this.createInvoice(req.body, transaction);
      } else {
        validateErrors = validate(req.body.appointmentId, appointmentId);
        if (validateErrors) {
          return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
        }
        const appointment = await AppointmentModel.findOne({
          where: { id: req.body.appointmentId, locationId: workingLocationIds },
          include: [
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
                  model: StaffModel.scope('safe'),
                  as: 'staffs'
                }
              ]
            }
          ]
        });
        if (!appointment) {
          return next(
            new CustomError(
              bookingErrorDetails.E_2002(`appointment ${req.body.appointmentId} not found`),
              httpStatus.NOT_FOUND
            )
          );
        }
        await this.convertApptToSale(appointment, transaction);
      }
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  private async createInvoice(data: any, transaction: any) {
    let invoiceCode = '';
    for (let i = 0; i < 10; i++) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      invoiceCode = 'INV' + randomCode;
      const existInvoiceCode = await InvoiceModel.findOne({ where: { code: invoiceCode } });
      if (!existInvoiceCode) {
        break;
      }
    }
    let dataInvoice: any = {
      id: uuidv4(),
      code: invoiceCode,
      locationId: data.locationId,
      customerWisereId: data.customerWisereId,
      source: data.source,
      note: data.note,
      discount: data.discount,
      tax: data.tax
    };
    let subTotal = 0;
    const invoiceDetails = [];
    const invoiceDetailStaffs = [];
    for (let i = 0; i < data.listInvoiceDetail.length; i++) {
      const service = await ServiceModel.findOne({ where: { id: data.listInvoiceDetail[i].serviceId } });
      if (!service) {
        throw new CustomError(
          serviceErrorDetails.E_1203(`serviceId ${data.listInvoiceDetail[i].serviceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const dataInvoiceDetail = {
        id: uuidv4(),
        invoiceId: dataInvoice.id,
        serviceId: data.listInvoiceDetail[i].serviceId,
        unit: data.listInvoiceDetail[i].unit,
        quantity: data.listInvoiceDetail[i].quantity,
        price: service.salePrice
      };
      invoiceDetails.push(dataInvoiceDetail);
      subTotal += dataInvoiceDetail.quantity * dataInvoiceDetail.price;
      for (let j = 0; j < data.listInvoiceDetail[i].listStaff.length; j++) {
        const staff = await StaffModel.findOne({ where: { id: data.listInvoiceDetail[i].listStaff[j].staffId } });
        if (!staff) {
          throw new CustomError(
            staffErrorDetails.E_4000(`staffId ${data.listInvoiceDetail[i].listStaff[j].staffId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const dataInvoiceDetailStaff = {
          invoiceDetailId: dataInvoiceDetail.id,
          staffId: data.listInvoiceDetail[i].listStaff[j].staffId
        };
        invoiceDetailStaffs.push(dataInvoiceDetailStaff);
      }
    }
    dataInvoice = {
      ...dataInvoice,
      subTotal: subTotal,
      status: EBalanceType.UNPAID,
      balance: subTotal
    };
    await InvoiceModel.create(dataInvoice, { transaction });
    await InvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });
    await InvoiceDetailStaffModel.bulkCreate(invoiceDetailStaffs, { transaction });
  }

  private async convertApptToSale(appointment: any, transaction: any) {
    let invoiceCode = '';
    for (let i = 0; i < 10; i++) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      invoiceCode = 'SON' + randomCode;
      const existInvoiceCode = await InvoiceModel.findOne({ where: { code: invoiceCode } });
      if (!existInvoiceCode) {
        break;
      }
    }
    let dataInvoice: any = {
      id: uuidv4(),
      code: invoiceCode,
      locationId: appointment.locationId,
      appointmentId: appointment.id,
      customerWisereId: appointment.customerWisereId
    };
    let subTotal = 0;
    const invoiceDetails = [];
    const invoiceDetailStaffs = [];
    for (let i = 0; i < appointment.appointmentDetails.length; i++) {
      const dataInvoiceDetail = {
        id: uuidv4(),
        invoiceId: dataInvoice.id,
        serviceId: appointment.appointmentDetails[i].serviceId,
        price: appointment.appointmentDetails[i].service.salePrice
      };
      invoiceDetails.push(dataInvoiceDetail);
      subTotal += dataInvoiceDetail.price;
      for (let j = 0; j < appointment.appointmentDetails[i].staffs.length; j++) {
        const dataInvoiceDetailStaff = {
          invoiceDetailId: dataInvoiceDetail.id,
          staffId: appointment.appointmentDetails[i].staffs[j].id
        };
        invoiceDetailStaffs.push(dataInvoiceDetailStaff);
      }
    }
    dataInvoice = {
      ...dataInvoice,
      subTotal: subTotal,
      status: EBalanceType.UNPAID,
      balance: subTotal
    };
    await InvoiceModel.create(dataInvoice, { transaction });
    await InvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });
    await InvoiceDetailStaffModel.bulkCreate(invoiceDetailStaffs, { transaction });
  }

  /**
   * @swagger
   * definitions:
   *   paymentCreate:
   *       properties:
   *           invoiceId:
   *               type: string
   *           type:
   *               type: string
   *           amount:
   *               type: integer
   *
   */

  /**
   * @swagger
   * /sale/create-payment:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createPayment
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPayment = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const data = {
        invoiceId: req.body.invoiceId,
        type: req.body.type,
        amount: req.body.amount
      };
      const validateErrors = validate(data, createPaymentSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      let invoice = await InvoiceModel.findOne({ where: { id: data.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${data.invoiceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
      const payment = await PaymentModel.create(data, { transaction });
      const balance = invoice.balance - payment.amount;
      let status: string;
      if (balance === 0) {
        status = EBalanceType.PAID;
      } else if (balance > 0 && balance < invoice.subTotal) {
        status = EBalanceType.PART_PAID;
      }
      invoice = await invoice.update({ balance: balance, status: status }, { transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(payment));
    } catch (error) {
      //rollback transaction
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/get-all-invoice:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getAllInvoice
   *     parameters:
   *       - in: query
   *         name: pageNum
   *         required: true
   *         schema:
   *            type: integer
   *       - in: query
   *         name: pageSize
   *         required: true
   *         schema:
   *            type: integer
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getAllInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const query: FindOptions = {
        include: [
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false
          },
          {
            model: LocationModel,
            as: 'location',
            required: true
          }
        ]
      };
      const invoices = await paginate(
        InvoiceModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoices));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/delete-invoice/{invoiceId}:
   *   delete:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: deleteInvoice
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *            type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const validateErrors = validate(req.params.invoiceId, deleteInvoiceSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const invoice = await InvoiceModel.findOne({ where: { id: req.params.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${req.params.invoiceId} not found`),
          HttpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
      if (!workingLocationIds.includes(invoice.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${invoice.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      const invoiceDetailsIds: any = (await InvoiceDetailModel.findAll({ where: { invoiceId: invoice.id } })).map(
        (invoiceDetailId: any) => invoiceDetailId.id
      );
      await InvoiceModel.destroy({ where: { id: invoice.id }, transaction });
      await InvoiceDetailModel.destroy({ where: { invoiceId: invoice.id }, transaction });
      await InvoiceDetailStaffModel.destroy({ where: { invoiceDetailId: invoiceDetailsIds }, transaction });
      await transaction.commit();
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoice));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/delete-invoice-detail/{invoiceDetailId}:
   *   delete:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: deleteInvoiceDetail
   *     parameters:
   *       - in: path
   *         name: invoiceDetailId
   *         required: true
   *         schema:
   *            type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public deleteInvoiceDetail = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const validateErrors = validate(req.params.invoiceDetailId, deleteInvoiceDetailSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      transaction = await sequelize.transaction();
      const invoiceDetailsId: any = await InvoiceDetailModel.findOne({ where: { id: req.params.invoiceDetailId } });
      if (!invoiceDetailsId) {
        throw new CustomError(
          invoiceErrorDetails.E_3301(`Invoice Detail Id ${req.params.invoiceDetailId} not found`),
          HttpStatus.NOT_FOUND
        );
      }
      const invoice = await InvoiceModel.findOne({ where: { id: invoiceDetailsId.invoiceId } });
      if (!workingLocationIds.includes(invoice.locationId)) {
        return next(
          new CustomError(
            branchErrorDetails.E_1001(`You can not access to location ${invoice.locationId}`),
            HttpStatus.FORBIDDEN
          )
        );
      }
      await InvoiceDetailModel.destroy({ where: { invoiceId: invoiceDetailsId.id }, transaction });
      await InvoiceDetailStaffModel.destroy({ where: { invoiceDetailId: invoiceDetailsId.id }, transaction });
      await transaction.commit();
      return res
        .status(httpStatus.OK)
        .send(buildSuccessMessage({ Mess: `Deleted Invoice Detail with InvoiceId: ${invoiceDetailsId.id}` }));
    } catch (error) {
      return next(error);
    }
  };
}
