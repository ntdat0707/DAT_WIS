import httpStatus from 'http-status';
import { logger } from '../../../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';
import { Sendpulse } from '../../../utils/notification';

export class EmailController extends BaseController {
  /**
   * @swagger
   * /notification/webhooks:
   *   post:
   *     tags:
   *       - Notification
   *     name: webhooks
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public webhooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info({
        label: 'webhooks',
        message: JSON.stringify(req.body, null, 2)
      });
      return res.status(httpStatus.OK).send(buildSuccessMessage({}));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /notification/test-notification:
   *   get:
   *     tags:
   *       - Notification
   *     name: notificationTest
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: bad request
   *       500:
   *         description:
   */
  public notificationTest = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await Sendpulse.sendRequest({
        path: 'blacklist',
        method: 'get'
      });
      return res.status(httpStatus.OK).send(buildSuccessMessage({}));
    } catch (error) {
      return next(error);
    }
  };
}
