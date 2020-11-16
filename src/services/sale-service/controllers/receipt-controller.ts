import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { CustomError } from '../../../utils/error-handlers';
import { baseValidateSchemas, validate } from '../../../utils/validator';
import {
  createNewReceiptSchema,
  createPaymentMethodSchema,
  createReceiptSchema,
  deletePaymentMethodSchema,
  receiptIdSchema,
  updatePaymentMethodSchema,
  filterReceiptSchema
} from '../configs/validate-schemas';
import {
  InvoiceModel,
  PaymentMethodModel,
  ProviderModel,
  ReceiptModel,
  InvoiceReceiptModel,
  sequelize,
  StaffModel,
  CustomerWisereModel,
  LocationModel,
  InvoiceDetailModel,
  ServiceModel
} from '../../../repositories/postgres/models';
import {
  branchErrorDetails,
  customerErrorDetails,
  invoiceErrorDetails,
  staffErrorDetails
} from '../../../utils/response-messages/error-details';
import { EBalanceType, ETypeOfReceipt } from '../../../utils/consts/index';
import { v4 as uuidv4 } from 'uuid';
import HttpStatus from 'http-status-codes';
import { buildSuccessMessage } from '../../../utils/response-messages/responses';
import {
  paymentErrorDetails,
  paymentMethodErrorDetails,
  receiptErrorDetails
} from '../../../utils/response-messages/error-details/sale';
import { FindOptions, Op } from 'sequelize';
import { paginate } from '../../../utils/paginator';
export class ReceiptController {
  /**
   * @swagger
   * definitions:
   *   PaymentMethods:
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
   *   receiptCreate:
   *       properties:
   *           invoiceId:
   *               type: string
   *           paymentMethods:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/PaymentMethods'
   *
   */

  /**
   * @swagger
   * /sale/receipt/create-invoice-receipt:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createInvoiceReceipt
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/receiptCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createInvoiceReceipt = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      const validateErrors = validate(req.body, createReceiptSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const invoice = await InvoiceModel.findOne({ where: { id: req.body.invoiceId } });
      if (!invoice) {
        throw new CustomError(
          invoiceErrorDetails.E_3300(`invoiceId ${req.body.invoiceId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      transaction = await sequelize.transaction();
      const data = {
        invoiceId: req.body.invoiceId,
        customerWisereId: invoice.customerWisereId,
        staffId: res.locals.staffPayload.id,
        locationId: invoice.locationId,
        total: invoice.total,
        balance: invoice.balance,
        paymentMethods: req.body.paymentMethods
      };
      await this.generateInvoiceReceipt(data, transaction);
      await transaction.commit();
      return res.status(httpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  public async generateInvoiceReceipt(data: any, transaction: any) {
    try {
      const providers = [];
      const receipts = [];
      const invoiceReceipts = [];
      let balance = data.balance;
      let status: string;
      for (let i = 0; i < data.paymentMethods.length; i++) {
        let dataProvider: any;
        if (data.paymentMethods[i].provider) {
          dataProvider = {
            id: uuidv4(),
            name: data.paymentMethods[i].provider.name,
            accountNumber: data.paymentMethods[i].provider.accountNumber
          };
          providers.push(dataProvider);
        }
        let receiptCode = '';
        while (true) {
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          receiptCode = 'REC' + randomCode;
          const existReceiptCode = await ReceiptModel.findOne({ where: { code: receiptCode } });
          if (!existReceiptCode) {
            break;
          }
        }
        const dataReceipt = {
          id: uuidv4(),
          code: receiptCode,
          customerWisereId: data.customerWisereId,
          staffId: data.staffId,
          amount: data.paymentMethods[i].amount,
          locationId: data.locationId,
          paymentMethodId: data.paymentMethods[i].paymentMethodId,
          providerId: dataProvider ? dataProvider.id : null,
          typeOfReceipt: ETypeOfReceipt.INVOICE
        };
        receipts.push(dataReceipt);
        balance -= dataReceipt.amount;
        if (balance < 0) {
          throw new CustomError(
            invoiceErrorDetails.E_3305(`amount is greater than the balance in the invoice`),
            httpStatus.BAD_REQUEST
          );
        }
        const dataInvoiceReceipt = {
          invoiceId: data.invoiceId,
          receiptId: dataReceipt.id
        };
        invoiceReceipts.push(dataInvoiceReceipt);
      }
      if (balance === 0) {
        status = EBalanceType.PAID;
      } else if (balance > 0 && balance < data.total) {
        status = EBalanceType.PART_PAID;
      }
      if (providers.length > 0) {
        await ProviderModel.bulkCreate(providers, { transaction });
      }
      await ReceiptModel.bulkCreate(receipts, { transaction });
      await InvoiceReceiptModel.bulkCreate(invoiceReceipts, { transaction });
      await InvoiceModel.update({ balance: balance, status: status }, { where: { id: data.invoiceId }, transaction });
      return balance;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @swagger
   * /sale/receipt/get-all-receipt:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getAllReceipt
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
      const conditions = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };
      let validateErrors;
      validateErrors = validate(conditions, filterReceiptSchema);
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
        ],
        order: [['updatedAt', 'DESC']]
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
   * /sale/receipt/get-receipt/{receiptId}:
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
          throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
        }
      }
      const receipt = await ReceiptModel.findOne({
        where: { id: receiptId },
        include: [
          {
            model: InvoiceModel,
            as: 'invoices',
            through: { attributes: [] },
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: InvoiceDetailModel,
                as: 'invoiceDetails',
                attributes: ['id', 'quantity'],
                include: [
                  {
                    model: ServiceModel,
                    as: 'service',
                    attributes: ['id', 'name', 'salePrice']
                  }
                ]
              }
            ]
          },
          {
            model: PaymentMethodModel,
            as: 'paymentMethod',
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: ProviderModel,
            as: 'provider',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: StaffModel,
            as: 'staff',
            required: true,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: CustomerWisereModel,
            as: 'customerWisere',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: LocationModel,
            as: 'location',
            required: true
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
   *   paymentMethodCreate:
   *       properties:
   *           paymentType:
   *               type: string
   *               enum: ['cash', 'card', 'wallet', 'other']
   *
   */

  /**
   * @swagger
   * /sale/receipt/create-payment-method:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createPaymentMethod
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentMethodCreate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        companyId: res.locals.staffPayload.companyId,
        paymentType: req.body.paymentType
      };
      const validateErrors = validate(data, createPaymentMethodSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const paymentMethod = await PaymentMethodModel.create(data);
      return res.status(HttpStatus.OK).send(buildSuccessMessage(paymentMethod));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/receipt/get-list-payment-method:
   *   get:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: getListPaymentMethod
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public getListPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = res.locals.staffPayload.companyId;
      const paymentMethod = await PaymentMethodModel.findAll({
        where: { companyId: companyId },
        order: [['updatedAt', 'DESC']]
      });
      return res.status(HttpStatus.OK).send(buildSuccessMessage(paymentMethod));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   paymentMethodUpdate:
   *       properties:
   *           paymentType:
   *               type: string
   *               enum: ['cash', 'card', 'wallet', 'other']
   *
   */

  /**
   * @swagger
   * /sale/receipt/update-payment-method/{paymentMethodId}:
   *   put:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: updatePaymentMethod
   *     parameters:
   *     - in: path
   *       name : paymentMethodId
   *       required: true
   *       type: string
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/paymentMethodUpdate'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public updatePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        paymentMethodId: req.params.paymentMethodId,
        paymentType: req.body.paymentType
      };
      const validateErrors = validate(data, updatePaymentMethodSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const paymentMethod = await PaymentMethodModel.findOne({ where: { id: data.paymentMethodId } });
      if (!paymentMethod) {
        throw new CustomError(
          paymentMethodErrorDetails.E_3700(`Payment method with id ${data.paymentMethodId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      await paymentMethod.update({ paymentType: data.paymentType });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /sale/receipt/delete-payment-method/{paymentMethodId}:
   *   delete:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: deletePaymentMethod
   *     parameters:
   *     - in: path
   *       name: paymentMethodId
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
  public deletePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paymentMethodId = req.params.paymentMethodId;
      const validateErrors = validate(paymentMethodId, deletePaymentMethodSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const paymentMethod = await PaymentMethodModel.findOne({
        where: { id: paymentMethodId }
      });
      if (!paymentMethod) {
        throw new CustomError(paymentErrorDetails.E_3601(`This payment method is not exist`), httpStatus.NOT_FOUND);
      }
      await PaymentMethodModel.destroy({
        where: { id: paymentMethodId }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   newReceipt:
   *       properties:
   *           customerWisereId:
   *               type: string
   *           amount:
   *               type: integer
   *           paymentMethodId:
   *               type: string
   *           typeOfReceipt:
   *               type: string
   *               enum: ['invoice', 'order']
   *           staffId:
   *               type: string
   *           dateReceived:
   *               type: string
   *           locationId:
   *               type: string
   *           description:
   *               type: string
   *
   */

  /**
   * @swagger
   * /sale/receipt/create-new-receipt:
   *   post:
   *     tags:
   *       - Sale
   *     security:
   *       - Bearer: []
   *     name: createNewReceipt
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/newReceipt'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public createNewReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workingLocationIds } = res.locals.staffPayload;
      const data: any = {
        customerWisereId: req.body.customerWisereId,
        amount: req.body.amount,
        paymentMethodId: req.body.paymentMethodId,
        typeOfReceipt: req.body.typeOfReceipt,
        staffId: req.body.staffId,
        dateReceived: req.body.dateReceived,
        locationId: req.body.locationId,
        description: req.body.description
      };
      const validateErrors = validate(data, createNewReceiptSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      const customerWisere = await CustomerWisereModel.findOne({ where: { id: data.customerWisereId } });
      if (!customerWisere) {
        throw new CustomError(
          customerErrorDetails.E_3001(`customerWisereId ${data.customerWisereId} not found`),
          HttpStatus.NOT_FOUND
        );
      }
      const paymentMethod = await PaymentMethodModel.findOne({
        where: { id: data.paymentMethodId, companyId: res.locals.staffPayload.companyId }
      });
      if (!paymentMethod) {
        throw new CustomError(
          paymentMethodErrorDetails.E_3700(`paymentMethodId ${data.paymentMethodId} not found`),
          httpStatus.NOT_FOUND
        );
      }
      const staff = await StaffModel.findOne({ where: { id: data.staffId } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000(`staff Id ${data.staffId} not found`), HttpStatus.NOT_FOUND);
      }
      if (!workingLocationIds.includes(data.locationId)) {
        throw new CustomError(
          branchErrorDetails.E_1001(`You can not access to location ${data.locationId}`),
          httpStatus.FORBIDDEN
        );
      }
      let receiptCode = '';
      while (true) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        receiptCode = 'REC' + randomCode;
        const existReceiptCode = await ReceiptModel.findOne({ where: { code: receiptCode } });
        if (!existReceiptCode) {
          break;
        }
      }
      data.code = receiptCode;
      const receipt = await ReceiptModel.create(data);
      return res.status(httpStatus.OK).send(buildSuccessMessage(receipt));
    } catch (error) {
      return next(error);
    }
  };
}
