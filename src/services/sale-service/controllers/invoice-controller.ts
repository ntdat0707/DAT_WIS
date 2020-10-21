import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createInvoiceSchema, createPaymentSchema, receiptIdSchema } from '../configs/validate-schemas';
import {
  AppointmentModel,
  CustomerWisereModel,
  InvoiceDetailModel,
  InvoiceDetailStaffModel,
  InvoiceModel,
  LocationModel,
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
  receiptErrorDetails
} from '../../../utils/response-messages/error-details/';
import { EBalanceType } from './../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { FindOptions } from 'sequelize';
import { paginate } from '../../../utils/paginator';
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
   *           totalQuantity:
   *               type: number
   *           subtotal:
   *               type: number
   *           totalAmount:
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
   * /sale/create-invoice:
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
        appointmentId: req.body.appointmentId,
        locationId: req.body.locationId,
        customerWisereId: req.body.customerWisereId,
        source: req.body.source,
        note: req.body.note,
        discount: req.body.discount,
        tax: req.body.tax
      };
      let subTotal = 0;
      let totalQuantity = 0;
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
      const invoiceDiscount = subTotal * dataInvoice.discount;
      const totalAmount = subTotal - invoiceDiscount + (invoiceDiscount * dataInvoice.tax) / 100;
      if (req.body.totalQuantity !== totalQuantity) {
        throw new CustomError(
          invoiceErrorDetails.E_3301(`total quantity ${req.body.totalQuantity} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      if (req.body.subtotal !== subTotal) {
        throw new CustomError(
          invoiceErrorDetails.E_3302(`subTotal ${req.body.subtotal} is incorrect`),
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
        status: EBalanceType.UNPAID,
        balance: subTotal
      };
      transaction = await sequelize.transaction();
      await InvoiceModel.create(dataInvoice, { transaction });
      await InvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });
      await InvoiceDetailStaffModel.bulkCreate(invoiceDetailStaffs, { transaction });
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
      if (data.amount > invoice.balance) {
        throw new CustomError(
          invoiceErrorDetails.E_3305(
            `amount ${data.amount} is greater than the balance ${invoice.balance} in the invoice`
          ),
          httpStatus.BAD_REQUEST
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
      let receiptCode = '';
      for (let i = 0; i < 10; i++) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        receiptCode = 'REC' + randomCode;
        const existReceiptCode = await ReceiptModel.findOne({ where: { code: receiptCode } });
        if (!existReceiptCode) {
          break;
        }
      }
      const dataReceipt = {
        code: receiptCode,
        customerId: invoice.customerWisereId,
        staffId: res.locals.staffPayload.id,
        amount: payment.amount,
        paymentId: payment.id,
        type: payment.type,
        locationId: invoice.locationId
      };
      await ReceiptModel.create(dataReceipt, { transaction });
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
      const receipt = await paginate(
        ReceiptModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );
      return res.status(httpStatus.OK).send(buildSuccessMessage(receipt));
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
      const receipt = await ReceiptModel.findOne({ where: { id: receiptId } });
      if (!receipt) {
        throw new CustomError(receiptErrorDetails.E_3400(`receiptId ${receiptId} not found`), httpStatus.NOT_FOUND);
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(receipt));
    } catch (error) {
      return next(error);
    }
  };
}
