import express from 'express';
import { createServer, Server } from 'http';
import socketIo, { Socket } from 'socket.io';
import cors from 'cors';
import amqp from 'amqplib';
require('dotenv').config();

import { authenticate } from '../../utils/middlewares/staff/auth';
import { generalErrorDetails } from '../../utils/response-messages/error-details';
import { CustomError } from '../../utils/error-handlers';
import { EQueueNames, rabbitmqURL } from '../../utils/event-queues';
import { IManagementLockAppointmentData } from '../../utils/consts';
import { logger } from '../../utils/logger';
import { buildErrorDetail } from '../../utils/response-messages';
import { Events, getRoomsFromStrings, SocketRoomPrefixes } from './configs/socket';
import { buildSocketErrorMessage, buildSocketSuccessMessage } from './configs/response';
const LOG_LABEL = process.env.NODE_NAME || 'development-mode';

export default class RealTimeGateway {
  public app: express.Application;
  public server: Server;
  private io: SocketIO.Server;
  private openRabbitMQ: any;

  constructor() {
    this.app = express();
    this.app.use(cors());
    this.server = createServer(this.app);
    this.io = socketIo(this.server);
    this.config();
  }

  private async config(): Promise<void> {
    this.server.listen(process.env.REAL_TIME_GTW_PORT);
    this.io.origins('*:*');
    this.io
      .use(async (socket, next) => {
        try {
          const authenticationInfo = await authenticate(socket.handshake.query.authorization);
          if (authenticationInfo instanceof CustomError) {
            const responseMsg = buildSocketErrorMessage(authenticationInfo.details);
            next(new Error(JSON.stringify(responseMsg)));
          }
          socket.request.staffPayload = authenticationInfo;
          next();
        } catch (error) {
          const resMsg = generalErrorDetails.E_0001(error);
          next(new Error(JSON.stringify(resMsg)));
        }
      })
      .on(Events.CONNECT, (socket: Socket) => {
        const appointmentRooms = getRoomsFromStrings(
          socket.request.staffPayload.workingLocationIds,
          SocketRoomPrefixes.APPOINTMENT
        );
        if (appointmentRooms.length > 0) {
          socket.join(appointmentRooms);
        }
      })
      .on(Events.CONNECT, (socket: Socket) => {
        const appointmentRooms = getRoomsFromStrings(
          socket.request.staffPayload.workingLocationIds,
          SocketRoomPrefixes.EDIT_APPOINTMENT
        );
        if (appointmentRooms.length > 0) {
          socket.join(appointmentRooms);
        }
      });
    await this.lockAppointmentData();
    await this.editAppointmentData();
  }
  private lockAppointmentData = async () => {
    try {
      if (!this.openRabbitMQ) this.openRabbitMQ = await amqp.connect(rabbitmqURL);
      const ch = await this.openRabbitMQ.createChannel();
      await ch.assertQueue(EQueueNames.LOCK_APPOINTMENT_DATA, { durable: false });
      await ch.consume(
        EQueueNames.LOCK_APPOINTMENT_DATA,
        async (messageObj: any) => {
          const msg = messageObj.content.toString();
          const data: IManagementLockAppointmentData[] = JSON.parse(msg);
          this.pushNotifyLockAppointmentData(data);
        },
        { noAck: true }
      );
    } catch (error) {
      throw error;
    }
  };

  private editAppointmentData = async () => {
    try {
      if (!this.openRabbitMQ) this.openRabbitMQ = await amqp.connect(rabbitmqURL);
      const ch = await this.openRabbitMQ.createChannel();
      await ch.assertQueue(EQueueNames.EDIT_APPOINTMENT_DATA, { durable: false });
      await ch.consume(
        EQueueNames.EDIT_APPOINTMENT_DATA,
        async (messageObj: any) => {
          const msg = messageObj.content.toString();
          const data: IManagementLockAppointmentData[] = JSON.parse(msg);
          this.pushNotifyEditAppointmentData(data);
        },
        { noAck: true }
      );
    } catch (error) {
      throw error;
    }
  };

  // private pushNotifyLockAppointmentData = (data: IManagementLockAppointmentData) => {
  //   try {
  //     if (data.services && data.services.locationId && data.services.data.length > 0) {
  //       const room = SocketRoomPrefixes.APPOINTMENT + data.services.locationId;
  //       this.io.to(room).emit(Events.LOCK_SERVICE, buildSocketSuccessMessage(data.services.data));
  //     }
  //     if (data.resources && data.resources.locationId && data.resources.data.length > 0) {
  //       const room = SocketRoomPrefixes.APPOINTMENT + data.resources.locationId;
  //       this.io.to(room).emit(Events.LOCK_RESOURCE, buildSocketSuccessMessage(data.resources.data));
  //     }
  //     if (data.staffs && data.staffs.length > 0) {
  //       for (const staff of data.staffs) {
  //         if (staff.locationId && staff.data && staff.data.length > 0) {
  //           const room = SocketRoomPrefixes.APPOINTMENT + staff.locationId;
  //           this.io.to(room).emit(Events.LOCK_STAFF, buildSocketSuccessMessage(staff.data));
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
  //     logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
  //   }
  // };

  private pushNotifyLockAppointmentData = (data: IManagementLockAppointmentData[]) => {
    try {
      if (data && data.length > 0) {
        const room = SocketRoomPrefixes.APPOINTMENT + data[0].appointment.locationId;
        this.io.to(room).emit(Events.LOCK_APPOINTMENT, buildSocketSuccessMessage(data));
      }
    } catch (error) {
      const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
      logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    }
  };

  private pushNotifyEditAppointmentData = (data: IManagementLockAppointmentData[]) => {
    try {
      if (data && data.length > 0) {
        const room = SocketRoomPrefixes.EDIT_APPOINTMENT + data[0].appointment.locationId;
        this.io.to(room).emit(Events.EDIT_APPOINTMENT, buildSocketSuccessMessage(data));
      }
    } catch (error) {
      const e = buildErrorDetail('0001', 'Internal server error', error.message || '');
      logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
    }
  };
}
