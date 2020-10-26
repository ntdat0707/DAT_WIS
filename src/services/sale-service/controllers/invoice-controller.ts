import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createInvoiceSchema, receiptIdSchema } from '../configs/validate-schemas';
import {
  AppointmentModel,
  CustomerWisereModel,
  DiscountModel,
  InvoiceDetailModel,
  InvoiceDetailStaffModel,
  InvoiceModel,
  LocationModel,
  PaymentMethodModel,
  PaymentModel,
  ReceiptModel,
  sequelize,
  ServiceModel,
  StaffModel
} from '../../../repositories/postgres/models';
import {
  bookingErrorDetails,
  branchErrorDetails,
  customerErrorDetails,
  invoiceErrorDetails,
  staffErrorDetails,
  receiptErrorDetails,
  discountErrorDetails
} from '../../../utils/response-messages/error-details/';
import { EBalanceType, EDiscountType } from './../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { FindOptions } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { InvoiceDetailLogModel } from '../../../repositories/mongo/models/invoice-detail-log-model';
import { InvoiceLogModel } from '../../../repositories/mongo/models/invoice-log-model';
import { PaymentController } from './payment-controller';
import { createInvoiceLogSchema, customerWisereIdSchema } from '../configs/validate-schemas/invoice';
export class InvoiceController {
  /**
   * @swagger
   * definitions:
   *   listPayment:
   *       properties:
   *           paymentMethodId:
   *               type: string
   *           amount:
   *               type: integer
   *           provider:
   *               type: object
   *               properties:
   *                   name:
   *                       type: string
   *                   accountNumber:
   *                       type: integer
   *
   */
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
   *           invoiceId:
   *               type: string
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
   *           discountId:
   *               type: string
   *           tax:
   *               type: number
   *           totalQuantity:
   *               type: number
   *           subTotal:
   *               type: number
   *           totalAmount:
   *               type: number
   *           balance:
   *               type: number
   *           listInvoiceDetail:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/listInvoiceDetail'
   *           listPayment:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/listPayment'
   */

  /**
   * @swagger
   * /sale/create-invoice:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createInvoice
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

  public createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      let validateErrors: any;
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
      if (req.body.customerWisereId) {
        const customerWisere = await CustomerWisereModel.findOne({ where: { id: req.body.customerWisereId } });
        if (!customerWisere) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${req.body.customerWisereId} not found`),
            httpStatus.NOT_FOUND
          );
        }
      }
      if (req.body.appointmentId) {
        const appointment = await AppointmentModel.findOne({ where: { id: req.body.appointmentId } });
        if (!appointment) {
          throw new CustomError(
            bookingErrorDetails.E_2002(`appointment ${req.body.appointmentId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const checkAppointmentId = await InvoiceModel.findOne({ where: { appointmentId: req.body.appointmentId } });
        if (checkAppointmentId) {
          throw new CustomError(
            invoiceErrorDetails.E_3304(`appointmentId ${req.body.appointmentId} existed in invoice`),
            httpStatus.BAD_REQUEST
          );
        }
      }
      let discount: DiscountModel;
      if (req.body.discountId) {
        discount = await DiscountModel.findOne({ where: { id: req.body.discountId } });
        if (!discount) {
          throw new CustomError(
            discountErrorDetails.E_3500(`discountId ${req.body.discountId} not found`),
            httpStatus.NOT_FOUND
          );
        }
      }
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
        id: req.body.invoiceId,
        code: invoiceCode,
        appointmentId: req.body.appointmentId,
        locationId: req.body.locationId,
        customerWisereId: req.body.customerWisereId,
        source: req.body.source,
        note: req.body.note,
        discountId: req.body.discountId,
        tax: req.body.tax
      };
      let subTotal = 0;
      let totalQuantity = 0;
      let checkBalance = 0;
      const invoiceDetails = [];
      const invoiceDetailStaffs = [];
      for (let i = 0; i < req.body.listInvoiceDetail.length; i++) {
        const service = await ServiceModel.findOne({ where: { id: req.body.listInvoiceDetail[i].serviceId } });
        if (!service) {
          throw new CustomError(
            serviceErrorDetails.E_1203(`serviceId ${req.body.listInvoiceDetail[i].serviceId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const dataInvoiceDetail = {
          id: uuidv4(),
          invoiceId: dataInvoice.id,
          serviceId: req.body.listInvoiceDetail[i].serviceId,
          unit: req.body.listInvoiceDetail[i].unit,
          quantity: req.body.listInvoiceDetail[i].quantity,
          price: service.salePrice
        };
        invoiceDetails.push(dataInvoiceDetail);
        subTotal += dataInvoiceDetail.quantity * dataInvoiceDetail.price;
        totalQuantity += dataInvoiceDetail.quantity;
        for (let j = 0; j < req.body.listInvoiceDetail[i].listStaff.length; j++) {
          const staff = await StaffModel.findOne({ where: { id: req.body.listInvoiceDetail[i].listStaff[j].staffId } });
          if (!staff) {
            throw new CustomError(
              staffErrorDetails.E_4000(`staffId ${req.body.listInvoiceDetail[i].listStaff[j].staffId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          const dataInvoiceDetailStaff = {
            invoiceDetailId: dataInvoiceDetail.id,
            staffId: req.body.listInvoiceDetail[i].listStaff[j].staffId
          };
          invoiceDetailStaffs.push(dataInvoiceDetailStaff);
        }
      }
      let invoiceDiscount = 0;
      if (discount) {
        if (discount.type === EDiscountType.CASH) {
          invoiceDiscount = discount.amount;
        } else {
          invoiceDiscount = subTotal * (discount.amount / 100);
        }
      }
      let tax = 0;
      if (dataInvoice.tax) {
        tax = ((subTotal - invoiceDiscount) * dataInvoice.tax) / 100;
      }
      const totalAmount = subTotal - invoiceDiscount + tax;
      if (req.body.totalQuantity !== totalQuantity) {
        throw new CustomError(
          invoiceErrorDetails.E_3301(`total quantity ${req.body.totalQuantity} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      if (req.body.subTotal !== subTotal) {
        throw new CustomError(
          invoiceErrorDetails.E_3302(`subTotal ${req.body.subTotal} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      if (req.body.totalAmount !== totalAmount) {
        throw new CustomError(
          invoiceErrorDetails.E_3303(`total amount ${req.body.totalAmount} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      dataInvoice = {
        ...dataInvoice,
        subTotal: subTotal,
        total: totalAmount,
        balance: totalAmount
      };
      transaction = await sequelize.transaction();
      await InvoiceModel.create(dataInvoice, { transaction });
      await InvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });
      await InvoiceDetailStaffModel.bulkCreate(invoiceDetailStaffs, { transaction });
      if (req.body.listPayment) {
        const data = {
          invoiceId: dataInvoice.id,
          customerId: dataInvoice.customerWisereId,
          staffId: res.locals.staffPayload.id,
          locationId: dataInvoice.locationId,
          total: totalAmount,
          balance: totalAmount,
          paymentMethods: req.body.listPayment
        };
        const paymentController = new PaymentController();
        checkBalance = await paymentController.createPaymentReceipt(data, transaction);
      } else {
        checkBalance = dataInvoice.balance;
      }
      if (checkBalance !== req.body.balance) {
        throw new CustomError(
          invoiceErrorDetails.E_3306(`Balance ${req.body.balance} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      await transaction.commit();
      InvoiceLogModel.deleteOne({ invoiceId: dataInvoice.id });
      return res.status(httpStatus.OK).send();
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
   * /sale/get-all-receipt:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getAllReceipt
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
  public getAllReceipt = async (req: Request, res: Response, next: NextFunction) => {
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
      const receipts = await paginate(
        ReceiptModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(httpStatus.OK).send(buildSuccessMessage(receipts));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/get-receipt/{receiptId}:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getReceipt
   *     parameters:
   *     - in: path
   *       name: receiptId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiptId = req.params.receiptId;
      const validateErrors = validate(receiptId, receiptIdSchema);
      if (validateErrors) {
        if (validateErrors) {
          return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
        }
      }
      const receipt = await ReceiptModel.findOne({
        where: { id: receiptId },
        include: [
          {
            model: PaymentModel,
            as: 'payment',
            include: [
              {
                model: PaymentMethodModel,
                as: 'paymentMethod'
              }
            ]
          }
        ]
      });
      if (!receipt) {
        throw new CustomError(receiptErrorDetails.E_3400(`receiptId ${receiptId} not found`), httpStatus.NOT_FOUND);
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(receipt));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   listInvoiceDetailLog:
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
   *   invoiceCreateLog:
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
   *           discountId:
   *               type: string
   *           totalQuantity:
   *               type: number
   *           subTotal:
   *               type: number
   *           totalAmount:
   *               type: number
   *           tax:
   *               type: number
   *           listInvoiceDetail:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/listInvoiceDetailLog'
   *
   */

  /**
   * @swagger
   * /sale/create-invoice-log:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createInvoiceLog
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/invoiceCreateLog'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createInvoiceLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      let validateErrors: any;
      validateErrors = validate(req.body, createInvoiceLogSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      if (!workingLocationIds.includes(req.body.locationId)) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
          httpStatus.FORBIDDEN
        );
      }
      if (req.body.customerWisereId) {
        const customerWisere = await CustomerWisereModel.findOne({ where: { id: req.body.customerWisereId } });
        if (!customerWisere) {
          throw new CustomError(
            customerErrorDetails.E_3001(`customerWisereId ${req.body.customerWisereId} not found`),
            httpStatus.NOT_FOUND
          );
        }
      }
      if (req.body.appointmentId) {
        const appointment = await AppointmentModel.findOne({ where: { id: req.body.appointmentId } });
        if (!appointment) {
          throw new CustomError(
            bookingErrorDetails.E_2002(`appointment ${req.body.appointmentId} not found`),
            httpStatus.NOT_FOUND
          );
        }
        const checkAppointmentId = await InvoiceModel.findOne({ where: { appointmentId: req.body.appointmentId } });
        if (checkAppointmentId) {
          throw new CustomError(
            invoiceErrorDetails.E_3304(`appointmentId ${req.body.appointmentId} existed in invoice`),
            httpStatus.BAD_REQUEST
          );
        }
      }
      let dataInvoiceLog: any = {
        invoiceId: uuidv4(),
        appointmentId: req.body.appointmentId,
        locationId: req.body.locationId,
        customerWisereId: req.body.customerWisereId,
        staffId: res.locals.staffPayload.id,
        source: req.body.source,
        note: req.body.note,
        discountId: req.body.discountId,
        tax: req.body.tax,
        timestamp: new Date(),
        subTotal: req.body.subTotal,
        totalAmount: req.body.totalAmount,
        totalQuantity: req.body.totalQuantity
      };
      const invoiceDetails = [];
      for (let i = 0; i < req.body.listInvoiceDetail.length; i++) {
        const service = await ServiceModel.findOne({ where: { id: req.body.listInvoiceDetail[i].serviceId } });
        if (!service) {
          throw new CustomError(
            serviceErrorDetails.E_1203(`serviceId ${req.body.listInvoiceDetail[i].serviceId} not found`),
            httpStatus.NOT_FOUND
          );
        }

        const listStaff: any = [];
        for (let j = 0; j < req.body.listInvoiceDetail[i].listStaff.length; j++) {
          const staff = await StaffModel.findOne({
            raw: true,
            where: { id: req.body.listInvoiceDetail[i].listStaff[j].staffId }
          });
          if (!staff) {
            throw new CustomError(
              staffErrorDetails.E_4000(`staffId ${req.body.listInvoiceDetail[i].listStaff[j].staffId} not found`),
              httpStatus.NOT_FOUND
            );
          }
          listStaff.push(staff);
        }
        const dataInvoiceDetailLog = {
          serviceId: req.body.listInvoiceDetail[i].serviceId,
          unit: req.body.listInvoiceDetail[i].unit,
          quantity: req.body.listInvoiceDetail[i].quantity,
          price: service.salePrice,
          listStaff: listStaff,
          timestamp: new Date()
        };
        const invoiceDetailLog = new InvoiceDetailLogModel(dataInvoiceDetailLog);
        invoiceDetails.push(invoiceDetailLog);
      }
      dataInvoiceLog = {
        ...dataInvoiceLog,
        invoiceDetail: invoiceDetails,
        status: EBalanceType.UNPAID,
        balance: req.body.subTotal
      };
      const invoiceLog = new InvoiceLogModel(dataInvoiceLog);
      await invoiceLog.save();
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoiceLog));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/get-list-invoice-log/{customerWisereId}:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getListInvoiceLog
   *     parameters:
   *     - in: path
   *       name: customerWisereId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getListInvoicesLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate(req.params.customerWisereId, customerWisereIdSchema);
      if (validateErrors) {
        return next(new CustomError(validateErrors, httpStatus.BAD_REQUEST));
      }
      const invoice = InvoiceLogModel.find({
        staffId: res.locals.staffPayload.id
      });
      if (!invoice) {
        return next(
          new CustomError(
            invoiceErrorDetails.E_3307(`Invoice log customer ${req.params.customerWisereId} not found`),
            httpStatus.NOT_FOUND
          )
        );
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoice));
    } catch (error) {
      return next(error);
    }
  };
}
