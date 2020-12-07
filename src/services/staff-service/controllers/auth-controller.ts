import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

import { validate } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
import { staffErrorDetails, generalErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  createAccessToken,
  createRefreshToken,
  IAccessTokenData,
  IRefreshTokenData,
  destroyTokens,
  verifyAccessToken,
  verifyRefreshToken
} from '../../../utils/jwt';
import {
  sequelize,
  StaffModel,
  CompanyModel,
  LocationModel,
  PipelineModel,
  PipelineStageModel,
  PaymentMethodModel,
  RoleModel
} from '../../../repositories/postgres/models';

import { PASSWORD_SALT_ROUNDS } from '../configs/consts';
import {
  createBusinessAccountSchema,
  loginSchema,
  emailSchema,
  changePasswordSchema,
  refreshTokenSchema,
  loginSocialSchema
} from '../configs/validate-schemas';

import { IStaffRecoveryPasswordTemplate } from '../../../utils/emailer/templates';
import { excuteSendingEmail } from '../../../utils/emailer';
import { redis, EKeys } from '../../../repositories/redis';
import { ESocialType } from '../../../utils/consts';
import { validateGoogleToken, validateFacebookToken } from '../../../utils/validator/validate-social-token';
import { IStaffRegisterAccountTemplate } from '../../../utils/emailer/templates/staff-register-account';
import * as ejs from 'ejs';
import * as path from 'path';
import { generatePWD } from '../../../utils/lib/generatePassword';
import { v4 } from 'public-ip';
import { LoginLogModel } from '../../../repositories/mongo/models';
import geoip from 'geoip-lite';
import { MqttUserModel } from '../../../repositories/mongo/models/mqtt-user-model';
import md5 from 'md5';
const recoveryPasswordUrlExpiresIn = process.env.RECOVERY_PASSWORD_URL_EXPIRES_IN;
const frontEndUrl = process.env.FRONT_END_URL;
export class AuthController {
  /**
   * @swagger
   * definitions:
   *   RegisterBusinessAccount:
   *       required:
   *           - email
   *           - password
   *           - firstName
   *           - lastName
   *       properties:
   *           email:
   *               type: string
   *           password:
   *               type: string
   *           firstName:
   *               type: string
   *           lastName:
   *               type: string
   *
   */

  /**
   * @swagger
   * /staff/auth/register-business-account:
   *   post:
   *     tags:
   *       - Staff
   *     name: register-business-account
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/RegisterBusinessAccount'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public registerBusinessAccount = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      // start transaction
      transaction = await sequelize.transaction();
      const data: any = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password
      };

      const validateErrors = validate(data, createBusinessAccountSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      const checkEmailExists = await StaffModel.scope('safe').findOne({ where: { email: data.email } });
      if (checkEmailExists) {
        throw new CustomError(staffErrorDetails.E_4001(), HttpStatus.BAD_REQUEST);
      }

      //encrypt password
      data.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
      const staffId = uuidv4();
      const companyId = uuidv4();
      data.onboardStep = 0;
      await StaffModel.create({ ...data, ...{ isBusinessAccount: true, id: staffId } }, { transaction });
      await CompanyModel.create({ id: companyId, ownerId: staffId }, { transaction });

      //create paymentMethod
      const paymentMethods = [];
      for (let i = 1; i < 5; i++) {
        let typeInfor: any = {};
        switch (i) {
          case 1:
            typeInfor = { paymentType: 'cash', paymentTypeNumber: 1 };
            break;
          case 2:
            typeInfor = { paymentType: 'card', paymentTypeNumber: 2 };
            break;
          case 3:
            typeInfor = { paymentType: 'wallet', paymentTypeNumber: 3 };
            break;
          case 4:
            typeInfor = { paymentType: 'other', paymentTypeNumber: 4 };
            break;
        } // 1:cash, 2:card, 3:waller, 4:other
        const paymentMethodData = {
          id: uuidv4(),
          companyId: companyId,
          paymentType: typeInfor.paymentType,
          paymentTypeNumber: typeInfor.paymentTypeNumber
        };
        paymentMethods.push(paymentMethodData);
      }
      await PaymentMethodModel.bulkCreate(paymentMethods, { transaction });

      const pipelineId1 = uuidv4();
      const pipelineId2 = uuidv4();
      const pipelineId3 = uuidv4();
      const pipelineId4 = uuidv4();

      const dataPipeline = [
        {
          id: pipelineId1,
          name: 'Tradition',
          companyId: companyId
        },
        {
          id: pipelineId2,
          name: 'Basic',
          companyId: companyId
        },
        {
          id: pipelineId3,
          name: 'SMS branding name',
          companyId: companyId
        },
        {
          id: pipelineId4,
          name: 'Appointment',
          companyId: companyId
        }
      ];
      await PipelineModel.bulkCreate(dataPipeline, { transaction });

      const dataStage = [
        {
          pipelineId: pipelineId1,
          name: 'Onsite',
          order: 1
        },
        {
          pipelineId: pipelineId1,
          name: 'Interactive',
          order: 2
        },
        {
          pipelineId: pipelineId1,
          name: 'Proposal made',
          order: 3
        },
        {
          pipelineId: pipelineId1,
          name: 'Demo Scheduled',
          order: 4
        },
        {
          pipelineId: pipelineId2,
          name: 'Lead-in',
          order: 1
        },
        {
          pipelineId: pipelineId2,
          name: 'Contact made',
          order: 2
        },
        {
          pipelineId: pipelineId2,
          name: 'Demo Scheduled',
          order: 3
        },
        {
          pipelineId: pipelineId2,
          name: 'Proposal made',
          order: 4
        },
        {
          pipelineId: pipelineId2,
          name: 'Negotiation Started',
          order: 5
        },
        {
          pipelineId: pipelineId3,
          name: 'Contact made',
          order: 1
        },
        {
          pipelineId: pipelineId3,
          name: 'SMS sent',
          order: 2
        },
        {
          pipelineId: pipelineId3,
          name: 'Filter',
          order: 3
        },
        {
          pipelineId: pipelineId3,
          name: 'Interactive',
          order: 4
        },
        {
          pipelineId: pipelineId3,
          name: 'Proposal made',
          order: 5
        },
        {
          pipelineId: pipelineId3,
          name: 'Negotiation Started',
          order: 6
        },
        {
          pipelineId: pipelineId4,
          name: 'New',
          order: 1
        },
        {
          pipelineId: pipelineId4,
          name: 'Contact Made',
          order: 2
        },
        {
          pipelineId: pipelineId4,
          name: 'Confirmed',
          order: 3
        }
      ];

      await PipelineStageModel.bulkCreate(dataStage, { transaction });
      const mqttUserData: any = {
        isSupperUser: false,
        username: staffId
      };
      mqttUserData.password = md5(staffId + data.email);
      const mqttUserModel = new MqttUserModel(mqttUserData);
      await mqttUserModel.save();
      //commit transaction
      await transaction.commit();
      const dataSendMail: IStaffRegisterAccountTemplate = {
        staffEmail: data.email,
        staffName: `${data.firstName} ${data.lastName}`
      };
      const pathFile = path.join(process.cwd(), 'src/utils/emailer/templates/staff-register-account.ejs');
      ejs.renderFile(pathFile, dataSendMail, async (err: any, dataEjs: any) => {
        if (!err) {
          await excuteSendingEmail({
            receivers: dataSendMail.staffEmail,
            subject: 'Welcome to Wisere',
            type: 'html',
            message: dataEjs
          });
        }
      });
      return res.status(HttpStatus.OK).send();
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
   *   StaffLogin:
   *       required:
   *           - email
   *           - password
   *           - source
   *       properties:
   *           email:
   *               type: string
   *           password:
   *               type: string
   *           source:
   *               type: string
   *           browser:
   *               type: string
   *           os:
   *               type: string
   *           device:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/login:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-login
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffLogin'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        email: req.body.email,
        password: req.body.password,
        browser: req.body.browser,
        source: req.body.source,
        os: req.body.os,
        device: req.body.device
      };
      let loginData: any;
      let loginLogModel: any;
      const validateErrors = validate(data, loginSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staff = await StaffModel.findOne({ raw: true, where: { email: data.email } });
      if (!staff) {
        loginData = {
          email: data.email,
          location:
            (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
            ' - ' +
            geoip.lookup(await v4()).country +
            ' ( country code )',
          timestamp: new Date(),
          browser: data.browser,
          device: data.device,
          os: data.os,
          status: false,
          source: data.source,
          ip: await v4()
        };
        loginLogModel = new LoginLogModel(loginData);
        await loginLogModel.save();
        throw new CustomError(staffErrorDetails.E_4002('Email or password invalid'), HttpStatus.NOT_FOUND);
      }
      const match = await compare(data.password, staff.password);
      if (!match) {
        loginData = {
          email: data.email,
          location:
            (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
            ' - ' +
            geoip.lookup(await v4()).country +
            ' ( country code )',
          timestamp: new Date(),
          browser: data.browser,
          device: data.device,
          os: data.os,
          status: false,
          source: data.source,
          ip: await v4()
        };
        loginLogModel = new LoginLogModel(loginData);
        await loginLogModel.save();

        throw new CustomError(staffErrorDetails.E_4002('Email or password invalid'), HttpStatus.NOT_FOUND);
      }

      const accessTokenData: IAccessTokenData = {
        userId: staff.id,
        userName: `${staff.firstName} ${staff.lastName}`,
        userType: 'staff'
      };
      const accessToken = await createAccessToken(accessTokenData);
      const refreshTokenData: IRefreshTokenData = {
        userId: staff.id,
        userName: `${staff.firstName} ${staff.lastName}`,
        userType: 'staff',
        accessToken
      };
      const refreshToken = await createRefreshToken(refreshTokenData);
      const profile = await StaffModel.scope('safe').findOne({
        where: { email: data.email },
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] }
          },
          {
            model: RoleModel,
            as: 'role'
          }
        ]
      });
      loginData = {
        email: data.email,
        location:
          (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
          ' - ' +
          geoip.lookup(await v4()).country +
          ' ( country code )',
        timestamp: new Date(),
        browser: data.browser,
        device: data.device,
        os: data.os,
        status: true,
        source: data.source,
        ip: await v4()
      };
      loginLogModel = new LoginLogModel(loginData);
      await loginLogModel.save();
      return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffRefreshToken:
   *       required:
   *           - refreshToken
   *       properties:
   *           refreshToken:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/refresh-tokens:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-refresh-tokens
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffRefreshToken'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */
  public refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputRefreshToken = req.body.refreshToken;
      const validateErrors = validate(inputRefreshToken, refreshTokenSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      const oldRefreshToken = await verifyRefreshToken(inputRefreshToken);
      const staff = await StaffModel.scope('safe').findOne({ where: { id: oldRefreshToken.userId } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000());
      }
      const isDestroy = await destroyTokens(inputRefreshToken);
      if (isDestroy instanceof CustomError) {
        throw isDestroy;
      }

      const newAccessTokenData: IAccessTokenData = {
        userId: staff.id,
        userName: `${staff.firstName} ${staff.lastName}`,
        userType: 'staff'
      };
      const newAccessToken = await createAccessToken(newAccessTokenData);
      const newRefreshTokenData: IRefreshTokenData = {
        userId: staff.id,
        userName: `${staff.firstName} ${staff.lastName}`,
        userType: 'staff',
        accessToken: newAccessToken
      };
      const newRefreshToken = await createRefreshToken(newRefreshTokenData);
      return res
        .status(HttpStatus.OK)
        .send(buildSuccessMessage({ accessToken: newAccessToken, refreshToken: newRefreshToken }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffRequestNewPassword:
   *       required:
   *           - email
   *       properties:
   *           email:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/request-new-password:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-request-new-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffRequestNewPassword'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public requestNewPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body.email;
      const validateErrors = validate({ email: email }, emailSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const staff = await StaffModel.scope('safe').findOne({ raw: true, where: { email: req.body.email } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000('Email not found'), HttpStatus.NOT_FOUND);
      }
      const uuidToken = uuidv4();
      const dataSendMail: IStaffRecoveryPasswordTemplate = {
        staffEmail: email,
        yourURL: `${frontEndUrl}/users/forgot-password?token=${uuidToken}`
      };
      await redis.setData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${uuidToken}`, JSON.stringify({ email: email }), {
        key: 'EX',
        value: recoveryPasswordUrlExpiresIn
      });
      const pathFile = path.join(process.cwd(), 'src/utils/emailer/templates/staff-recovery-password.ejs');
      ejs.renderFile(pathFile, dataSendMail, async (err: any, dataEjs: any) => {
        if (!err) {
          await excuteSendingEmail({
            receivers: email,
            subject: 'Your Login information for Wisere',
            type: 'html',
            message: dataEjs
          });
        }
      });

      res.status(HttpStatus.OK).send(buildSuccessMessage({ msg: 'Please check your email' }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffChangePassword:
   *       required:
   *           - token
   *           - newPassword
   *       properties:
   *           token:
   *               type: string
   *           newPassword:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/change-password:
   *   put:
   *     tags:
   *       - Staff
   *     name: staff-change-password
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffChangePassword'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = {
        token: req.body.token,
        newPassword: req.body.newPassword
      };
      const validateErrors = validate(body, changePasswordSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      const tokenStoraged = await redis.getData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${body.token}`);
      if (!tokenStoraged) {
        throw new CustomError(staffErrorDetails.E_4004('Invalid token'), HttpStatus.UNAUTHORIZED);
      }
      const data = JSON.parse(tokenStoraged);
      const staff = await StaffModel.findOne({ raw: true, where: { email: data.email } });
      if (!staff) {
        throw new CustomError(staffErrorDetails.E_4000('Email not found'), HttpStatus.NOT_FOUND);
      }
      const password = await hash(body.newPassword, PASSWORD_SALT_ROUNDS);
      await StaffModel.update(
        { password: password },
        {
          where: {
            email: data.email
          }
        }
      );
      await redis.deleteData(`${EKeys.STAFF_RECOVERY_PASSWORD_URL}-${body.token}`);
      res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   StaffLoginSocial:
   *       required:
   *           - provider
   *           - providerId
   *           - fullName
   *           - token
   *           - source
   *       properties:
   *           provider:
   *               type: string
   *           providerId:
   *               type: string
   *           email:
   *               type: string
   *           fullName:
   *               type: string
   *           avatarPath:
   *               type: string
   *           token:
   *               type: string
   *           source:
   *               type: string
   *           browser:
   *               type: string
   *           os:
   *               type: string
   *           device:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/login-social:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-login-social
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffLoginSocial'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public loginSocial = async (req: Request, res: Response, next: NextFunction) => {
    let transaction = null;
    try {
      let staff: StaffModel;
      let data: any;
      let accessTokenData: IAccessTokenData;
      let accessToken: string;
      let refreshTokenData: IRefreshTokenData;
      let refreshToken: string;
      let profile: StaffModel;
      let newStaff: StaffModel;
      let socialInfor: any;
      let loginData: any;
      let loginLogModel: any;
      let mqttUserData: any;
      let mqttUserModel: any;
      const validateErrors = validate(req.body, loginSocialSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      if (req.body.email) {
        if (req.body.provider === ESocialType.GOOGLE) {
          socialInfor = await validateGoogleToken(req.body.token);
          if (socialInfor.response.email !== req.body.email || socialInfor.response.expires_in === 0) {
            loginData = {
              email: req.body.email,
              location:
                (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
                ' - ' +
                geoip.lookup(await v4()).country +
                ' ( country code )',
              timestamp: new Date(),
              browser: req.body.browser,
              device: req.body.device,
              os: req.body.os,
              status: false,
              source: req.body.source,
              ip: await v4()
            };
            loginLogModel = new LoginLogModel(loginData);
            await loginLogModel.save();
            throw new CustomError(staffErrorDetails.E_4006('Incorrect google token'), HttpStatus.BAD_REQUEST);
          }
        } else if (req.body.provider === ESocialType.FACEBOOK) {
          socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
          if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
            loginData = {
              email: req.body.email,
              location:
                (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
                ' - ' +
                geoip.lookup(await v4()).country +
                ' ( country code )',
              timestamp: new Date(),
              browser: req.body.browser,
              device: req.body.device,
              os: req.body.os,
              status: false,
              source: req.body.source,
              ip: await v4()
            };
            loginLogModel = new LoginLogModel(loginData);
            await loginLogModel.save();
            throw new CustomError(staffErrorDetails.E_4006('Incorrect facebook token'), HttpStatus.BAD_REQUEST);
          }
        }
        staff = await StaffModel.scope('safe').findOne({ raw: true, where: { email: req.body.email } });
      } else {
        if (req.body.provider === ESocialType.GOOGLE) {
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: false,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          throw new CustomError(staffErrorDetails.E_4007('Missing email'), HttpStatus.BAD_REQUEST);
        }
      }
      if (staff) {
        if (req.body.provider === ESocialType.FACEBOOK) {
          if (staff.facebookId === null) {
            data = {
              facebookId: req.body.providerId,
              avatarPath: req.body.avatarPath ? req.body.avatarPath : null
            };
            await StaffModel.update(data, { where: { email: req.body.email } });
          } else {
            if (staff.facebookId !== req.body.providerId) {
              loginData = {
                email: req.body.email,
                location:
                  (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
                  ' - ' +
                  geoip.lookup(await v4()).country +
                  ' ( country code )',
                timestamp: new Date(),
                browser: req.body.browser,
                device: req.body.device,
                os: req.body.os,
                status: false,
                source: req.body.source,
                ip: await v4()
              };
              loginLogModel = new LoginLogModel(loginData);
              await loginLogModel.save();
              throw new CustomError(staffErrorDetails.E_4005('providerId incorrect'), HttpStatus.BAD_REQUEST);
            }
          }
          accessTokenData = {
            userId: staff.id,
            userName: `${staff.firstName} ${staff.lastName}`,
            userType: 'staff'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: staff.id,
            userName: `${staff.firstName} ${staff.lastName}`,
            userType: 'staff',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await StaffModel.scope('safe').findOne({
            where: { email: req.body.email },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                through: { attributes: [] }
              }
            ]
          });
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: true,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        if (req.body.provider === ESocialType.GOOGLE) {
          if (staff.googleId === null) {
            data = {
              googleId: req.body.providerId,
              avatarPath: req.body.avatarPath ? req.body.avatarPath : null
            };
            await StaffModel.update(data, { where: { email: req.body.email } });
          } else {
            if (staff.googleId !== req.body.providerId) {
              loginData = {
                email: req.body.email,
                location:
                  (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
                  ' - ' +
                  geoip.lookup(await v4()).country +
                  ' ( country code )',
                timestamp: new Date(),
                browser: req.body.browser,
                device: req.body.device,
                os: req.body.os,
                status: false,
                source: req.body.source,
                ip: await v4()
              };
              loginLogModel = new LoginLogModel(loginData);
              await loginLogModel.save();
              throw new CustomError(staffErrorDetails.E_4005('providerId incorrect'), HttpStatus.BAD_REQUEST);
            }
          }
          accessTokenData = {
            userId: staff.id,
            userName: `${staff.firstName} ${staff.lastName}`,
            userType: 'staff'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: staff.id,
            userName: `${staff.firstName} ${staff.lastName}`,
            userType: 'staff',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await StaffModel.scope('safe').findOne({
            where: { email: req.body.email },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                through: { attributes: [] }
              }
            ]
          });
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: true,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
      }

      // start transaction
      transaction = await sequelize.transaction();
      if (req.body.provider === ESocialType.FACEBOOK) {
        socialInfor = await validateFacebookToken(req.body.providerId, req.body.token);
        if (socialInfor.response.name !== req.body.fullName || socialInfor.response.id !== req.body.providerId) {
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: false,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          throw new CustomError(staffErrorDetails.E_4006('Incorrect facebook token'), HttpStatus.BAD_REQUEST);
        }
        staff = await StaffModel.scope('safe').findOne({ raw: true, where: { facebookId: req.body.providerId } });
        if (!staff) {
          const password = await generatePWD(8);
          data = {
            lastName: req.body.fullName.split(' ')[0],
            firstName: req.body.fullName.split(' ').slice(1).join(' ')
              ? req.body.fullName.split(' ').slice(1).join(' ')
              : null,
            email: req.body.email ? req.body.email : null,
            facebookId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : null,
            isBusinessAccount: true,
            onboardStep: 0
          };
          data.id = uuidv4();
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newStaff = await StaffModel.create(data, { transaction });
          await CompanyModel.create({ ownerId: data.id }, { transaction });
          mqttUserData = {
            isSupperUser: false,
            username: data.id
          };
          mqttUserData.password = md5(data.id + data.email);
          mqttUserModel = new MqttUserModel(mqttUserData);
          await mqttUserModel.save();
          accessTokenData = {
            userId: newStaff.id,
            userName: `${newStaff.firstName} ${newStaff.lastName}`,
            userType: 'staff'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: newStaff.id,
            userName: `${newStaff.firstName} ${newStaff.lastName}`,
            userType: 'staff',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await StaffModel.scope('safe').findOne({
            where: { facebookId: newStaff.facebookId },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                through: { attributes: [] }
              }
            ],
            transaction
          });
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: true,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          //commit transaction
          await transaction.commit();
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        accessTokenData = {
          userId: staff.id,
          userName: `${staff.firstName} ${staff.lastName}`,
          userType: 'staff'
        };
        accessToken = await createAccessToken(accessTokenData);
        refreshTokenData = {
          userId: staff.id,
          userName: `${staff.firstName} ${staff.lastName}`,
          userType: 'staff',
          accessToken
        };
        refreshToken = await createRefreshToken(refreshTokenData);
        profile = await StaffModel.scope('safe').findOne({
          where: { facebookId: staff.facebookId },
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              through: { attributes: [] }
            }
          ],
          transaction
        });
        loginData = {
          email: req.body.email,
          location:
            (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
            ' - ' +
            geoip.lookup(await v4()).country +
            ' ( country code )',
          timestamp: new Date(),
          browser: req.body.browser,
          device: req.body.device,
          os: req.body.os,
          status: true,
          source: req.body.source,
          ip: await v4()
        };
        loginLogModel = new LoginLogModel(loginData);
        await loginLogModel.save();
        //commit transaction
        await transaction.commit();
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
      if (req.body.provider === ESocialType.GOOGLE) {
        staff = await StaffModel.scope('safe').findOne({ raw: true, where: { googleId: req.body.providerId } });
        if (!staff) {
          const password = await generatePWD(8);
          data = {
            lastName: req.body.fullName.split(' ')[0],
            firstName: req.body.fullName.split(' ').slice(1).join(' ')
              ? req.body.fullName.split(' ').slice(1).join(' ')
              : null,
            email: req.body.email,
            googleId: req.body.providerId,
            avatarPath: req.body.avatarPath ? req.body.avatarPath : null,
            isBusinessAccount: true,
            onboardStep: 0
          };
          data.id = uuidv4();
          data.password = await hash(password, PASSWORD_SALT_ROUNDS);
          newStaff = await StaffModel.create(data, { transaction });
          await CompanyModel.create({ ownerId: data.id }, { transaction });
          mqttUserData = {
            isSupperUser: false,
            username: data.id
          };
          mqttUserData.password = md5(data.id + data.email);
          mqttUserModel = new MqttUserModel(mqttUserData);
          await mqttUserModel.save();
          accessTokenData = {
            userId: newStaff.id,
            userName: `${newStaff.firstName} ${newStaff.lastName}`,
            userType: 'staff'
          };
          accessToken = await createAccessToken(accessTokenData);
          refreshTokenData = {
            userId: newStaff.id,
            userName: `${newStaff.firstName} ${newStaff.lastName}`,
            userType: 'staff',
            accessToken
          };
          refreshToken = await createRefreshToken(refreshTokenData);
          profile = await StaffModel.scope('safe').findOne({
            where: { googleId: newStaff.googleId },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                through: { attributes: [] }
              }
            ],
            transaction
          });
          loginData = {
            email: req.body.email,
            location:
              (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
              ' - ' +
              geoip.lookup(await v4()).country +
              ' ( country code )',
            timestamp: new Date(),
            browser: req.body.browser,
            device: req.body.device,
            os: req.body.os,
            status: true,
            source: req.body.source,
            ip: await v4()
          };
          loginLogModel = new LoginLogModel(loginData);
          await loginLogModel.save();
          //commit transaction
          await transaction.commit();
          return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
        }
        accessTokenData = {
          userId: staff.id,
          userName: `${staff.firstName} ${staff.lastName}`,
          userType: 'staff'
        };
        accessToken = await createAccessToken(accessTokenData);
        refreshTokenData = {
          userId: staff.id,
          userName: `${staff.firstName} ${staff.lastName}`,
          userType: 'staff',
          accessToken
        };
        refreshToken = await createRefreshToken(refreshTokenData);
        profile = await StaffModel.scope('safe').findOne({
          where: { googleId: staff.googleId },
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              through: { attributes: [] }
            }
          ],
          transaction
        });
        loginData = {
          email: req.body.email,
          location:
            (geoip.lookup(await v4()).city ? geoip.lookup(await v4()).city : 'unknown') +
            ' - ' +
            geoip.lookup(await v4()).country +
            ' ( country code )',
          timestamp: new Date(),
          browser: req.body.browser,
          device: req.body.device,
          os: req.body.os,
          status: true,
          source: req.body.source,
          ip: await v4()
        };
        loginLogModel = new LoginLogModel(loginData);
        await loginLogModel.save();
        //commit transaction
        await transaction.commit();
        return res.status(HttpStatus.OK).send(buildSuccessMessage({ accessToken, refreshToken, profile }));
      }
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
   *   StaffVerifyToken:
   *       required:
   *           - token
   *       properties:
   *           token:
   *               type: string
   *
   */
  /**
   * @swagger
   * /staff/auth/verify-token:
   *   post:
   *     tags:
   *       - Staff
   *     name: staff-verify-token
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/StaffVerifyToken'
   *     responses:
   *       200:
   *         description: Success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       500:
   *         description: |
   *           </br> xxx1: Something error
   *           </br> xxx2: Internal server errors
   */

  public verifyTokenStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.token) {
        throw new CustomError(generalErrorDetails.E_0002());
      }
      const accessTokenData = await verifyAccessToken(req.body.token);
      if (accessTokenData instanceof CustomError) {
        throw new CustomError(generalErrorDetails.E_0003());
      }
      const staff = await StaffModel.scope('safe').findOne({
        where: { id: accessTokenData.userId },
        include: [
          {
            model: LocationModel,
            as: 'workingLocations',
            through: { attributes: [] }
          },
          {
            model: RoleModel,
            as: 'role'
          }
        ]
      });
      if (!staff) {
        throw new CustomError(generalErrorDetails.E_0003());
      }
      return res.status(HttpStatus.OK).send(buildSuccessMessage(staff));
    } catch (error) {
      return next(error);
    }
  };
}
