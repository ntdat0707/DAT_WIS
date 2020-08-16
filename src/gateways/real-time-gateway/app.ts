import express from 'express';
import { createServer, Server } from 'http';
import socketIo, { Socket } from 'socket.io';
require('dotenv').config();

import { authenticate } from '../../utils/middlewares/staff/auth';
import { generalErrorDetails } from '../../utils/response-messages/error-details';
import { CustomError } from '../../utils/error-handlers';
import { Events, getRoomsFromStrings, SocketRoomPrefixes } from './configs/socket';
import { buildSocketErrorMessage } from './configs/response';

export default class RealTimeGateway {
  public app: express.Application;
  public server: Server;
  private io: SocketIO.Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = socketIo(this.server);
    this.config();
  }

  private async config(): Promise<void> {
    this.server.listen(process.env.REAL_TIME_GTW_PORT);
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
        // console.log('socket id: ============', socket.id, socket.request.staffPayload);
        const appointmentRooms = getRoomsFromStrings(
          socket.request.staffPayload.workingLocationIds,
          SocketRoomPrefixes.APPOINTMENT
        );
        if (appointmentRooms.length > 0) {
          socket.join(appointmentRooms);
        }
      });
    setTimeout(() => {
      // this.io.emit('cc', 'cc from server');
      const someRooms = [
        'appointment-764eaa2b-c5aa-451f-82d0-63fceb424af6',
        'appointment-a825577d-95d0-4e2a-8577-81c35deab014'
      ];
      for (const room of someRooms) {
        this.io.to(room).emit('server-sent-from-room', 'cc ne bla bla blaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      }
    }, 10000);
  }
}
