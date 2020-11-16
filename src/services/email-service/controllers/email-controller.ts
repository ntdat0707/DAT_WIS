import httpStatus from 'http-status';
import { logger } from '../../../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { BaseController } from '../../../services/booking-service/controllers/base-controller';

export class EmailController extends BaseController {
  /**
   * @swagger
   * /webhooks:
   *   get:
   *     tags:
   *       - Email
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
}
