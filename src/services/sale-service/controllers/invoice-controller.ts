import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import { createInvoiceSchema, invoiceIdSchema, filterInvoiceSchema } from '../configs/validate-schemas';
import {
  AppointmentDetailModel,
  AppointmentModel,
  CustomerWisereModel,
  DiscountModel,
  InvoiceDetailModel,
  InvoiceDetailStaffModel,
  InvoiceModel,
  LocationModel,
  PaymentMethodModel,
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
  discountErrorDetails
} from '../../../utils/response-messages/error-details/';
import { EBalanceType, EDiscountType } from './../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import { serviceErrorDetails } from '../../../utils/response-messages/error-details/branch/service';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { FindOptions, Op } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import { InvoiceDetailLogModel } from '../../../repositories/mongo/models/invoice-detail-log-model';
import { ReceiptController } from './receipt-controller';
import { createInvoiceLogSchema, getListInvoicesLog } from '../configs/validate-schemas/invoice';
import { InvoiceLogModel } from '../../../repositories/mongo/models';
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
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
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
      while (true) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        invoiceCode = 'INV' + randomCode;
        const existInvoiceCode = await InvoiceModel.findOne({ where: { code: invoiceCode } });
        if (!existInvoiceCode) {
          break;
        }
      }
      let dataInvoice: any = {
        id: req.body.invoiceId ? req.body.invoiceId : uuidv4(),
        code: invoiceCode,
        appointmentId: req.body.appointmentId,
        locationId: req.body.locationId,
        customerWisereId: req.body.customerWisereId,
        source: req.body.source,
        note: req.body.note,
        discountId: req.body.discountId,
        tax: req.body.tax,
        createdBy: res.locals.staffPayload.id
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
          const staff = await StaffModel.scope('safe').findOne({
            where: { id: req.body.listInvoiceDetail[i].listStaff[j].staffId }
          });
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
          customerWisereId: dataInvoice.customerWisereId,
          staffId: res.locals.staffPayload.id,
          locationId: dataInvoice.locationId,
          total: totalAmount,
          balance: totalAmount,
          paymentMethods: req.body.listPayment
        };
        const paymentController = new ReceiptController();
        checkBalance = await paymentController.generateInvoiceReceipt(data, transaction);
      } else {
        checkBalance = dataInvoice.balance;
      }
      if (checkBalance !== req.body.balance) {
        throw new CustomError(
          invoiceErrorDetails.E_3306(`Balance ${req.body.balance} is incorrect`),
          httpStatus.BAD_REQUEST
        );
      }
      await InvoiceLogModel.deleteOne({ invoiceId: dataInvoice.id }).exec();
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
   * /sale/get-all-invoice:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getAllInvoice
   *     parameters:
   *       - in: query
   *         name: fromDate
   *         schema:
   *            type: string
   *       - in: query
   *         name: toDate
   *         schema:
   *            type: string
   *       - in: query
   *         name: status
   *         schema:
   *            type: array
   *            items:
   *                type: string
   *       - in: query
   *         name: locationId
   *         schema:
   *            type: string
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
      const conditions = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        status: req.query.status,
        locationId: req.query.locationId
      };
      let validateErrors;
      validateErrors = validate(conditions, filterInvoiceSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const { workingLocationIds } = res.locals.staffPayload;
      const query: FindOptions = {
        include: [
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      };
      if (conditions.fromDate || conditions.toDate) {
        const createdAt: any = {};
        if (conditions.fromDate) {
          createdAt[Op.gte] = conditions.fromDate;
        }
        if (conditions.toDate) {
          createdAt[Op.lte] = conditions.toDate;
        }
        query.where = {
          ...query.where,
          createdAt
        };
      }
      if (conditions.status) {
        query.where = {
          ...query.where,
          status: conditions.status
        };
      }
      const conditionLocationId = conditions.locationId
        ? {
            model: LocationModel,
            as: 'location',
            where: { id: conditions.locationId }
          }
        : {
            model: LocationModel,
            as: 'location',
            where: { id: workingLocationIds }
          };
      query.include.push(conditionLocationId);
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
   * /sale/get-invoice/{invoiceId}:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getInvoice
   *     parameters:
   *     - in: path
   *       name: invoiceId
   *       required: true
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoiceId = req.params.invoiceId;
      const validateErrors = validate(invoiceId, invoiceIdSchema);
      if (validateErrors) {
        if (validateErrors) {
          throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
        }
      }
      const invoice = await InvoiceModel.findOne({
        where: { id: invoiceId },
        include: [
          {
            model: InvoiceDetailModel,
            as: 'invoiceDetails',
            include: [
              {
                model: ServiceModel,
                as: 'service'
              },
              {
                attributes: ['id'],
                model: InvoiceDetailStaffModel,
                as: 'invoiceDetailStaffs',
                include: [
                  {
                    model: StaffModel,
                    as: 'staff'
                  }
                ]
              }
            ]
          },
          {
            model: ReceiptModel,
            as: 'receipts',
            through: { attributes: [] },
            include: [
              {
                model: PaymentMethodModel,
                as: 'paymentMethod',
                required: true,
                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
              }
            ]
          },
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false
          },
          {
            model: LocationModel,
            as: 'location'
          },
          {
            model: StaffModel,
            as: 'staff',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: AppointmentModel,
            as: 'appointment',
            attributes: ['id'],
            required: false,
            include: [
              {
                model: AppointmentDetailModel,
                as: 'appointmentDetails',
                attributes: ['duration']
              }
            ]
          }
        ]
      });
      if (!invoice) {
        throw new CustomError(invoiceErrorDetails.E_3300(`invoiceId ${invoiceId} not found`), httpStatus.NOT_FOUND);
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoice));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   listInvoiceDetailsLog:
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
   *   listInvoicesLog:
   *       properties:
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
   *           listInvoiceDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/listInvoiceDetailsLog'
   *
   */
  /**
   * @swagger
   * definitions:
   *   invoiceCreateLog:
   *       properties:
   *           locationId:
   *               type: string
   *           listInvoices:
   *               type: array
   *               items:
   *                   $ref:'#/definitions/listInvoicesLog'
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
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      if (!workingLocationIds.includes(req.body.locationId)) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${req.body.locationId}`),
          httpStatus.FORBIDDEN
        );
      }
      if (!(req.body.listInvoices as []).every((invoice) => req.body.listInvoices.includes(invoice))) {
        throw new CustomError(invoiceErrorDetails.E_3308(), httpStatus.BAD_REQUEST);
      }
      const listInvoices = [...req.body.listInvoices];
      for (let i = 0; i < listInvoices.length; i++) {
        let dataInvoiceLog: any = {
          invoiceId: uuidv4(),
          appointmentId: listInvoices[i].appointmentId,
          locationId: req.body.locationId,
          customerWisereId: listInvoices[i].customerWisereId,
          staffId: res.locals.staffPayload.id,
          source: listInvoices[i].source,
          note: listInvoices[i].note,
          discountId: listInvoices[i].discountId,
          tax: listInvoices[i].tax,
          timestamp: new Date(),
          subTotal: listInvoices[i].subTotal,
          totalAmount: listInvoices[i].totalAmount,
          totalQuantity: listInvoices[i].totalQuantity
        };
        const invoiceDetails = [];
        for (let j = 0; j < listInvoices[i].listInvoiceDetails.length; j++) {
          const service = await ServiceModel.findOne({
            where: { id: listInvoices[i].listInvoiceDetails[j].serviceId }
          });
          const listStaff: any = [];
          for (let k = 0; k < listInvoices[i].listInvoiceDetails[j].listStaff.length; k++) {
            const staff = await StaffModel.scope('safe').findOne({
              raw: true,
              where: { id: listInvoices[i].listInvoiceDetails[j].listStaff[k].staffId }
            });
            listStaff.push(staff);
          }
          const dataInvoiceDetailLog = {
            serviceId: listInvoices[i].listInvoiceDetails[j].serviceId,
            unit: listInvoices[i].listInvoiceDetails[j].unit,
            quantity: listInvoices[i].listInvoiceDetails[j].quantity,
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
          balance: listInvoices[i].subTotal
        };
        const invoiceLog = new InvoiceLogModel(dataInvoiceLog);
        await invoiceLog.save();
      }
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/get-list-invoice-log/{locationId}:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getListInvoiceLog
   *     parameters:
   *     - in: path
   *       name: locationId
   *       required: true
   *       type: string
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
      const dataInput = {
        staffId: res.locals.staffPayload.id,
        locationId: req.params.locationId
      };
      const validateErrors = validate(dataInput, getListInvoicesLog);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const invoices = await InvoiceLogModel.find(
        {
          staffId: res.locals.staffPayload.id,
          locationId: req.params.locationId
        },
        {
          sort: {
            timestamp: -1 //Sort by Date created DESC
          }
        }
      ).exec();
      if (!invoices) {
        throw new CustomError(invoiceErrorDetails.E_3300(`Invoice log not found`), httpStatus.NOT_FOUND);
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage(invoices));
    } catch (error) {
      return next(error);
    }
  };
}
