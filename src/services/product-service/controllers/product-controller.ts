import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { buildSuccessMessage } from '../../../utils/response-messages';
import { CustomError } from '../../../utils/error-handlers';
import { validate } from '../../../utils/validator';
import { uploadImageProductSchema } from '../configs/validate-schemas';
export class ProductController {
  /**
   * @swagger
   * /product/upload-image-product:
   *   post:
   *     tags:
   *       - Product
   *     security:
   *       - Bearer: []
   *     name: uploadImageProduct
   *     consumes:
   *     - multipart/form-data
   *     parameters:
   *     - in: "formData"
   *       name: "photo"
   *       type: file
   *       description: The file to upload.
   *     responses:
   *       200:
   *         description:
   *       400:
   *         description:
   *       404:
   *         description:
   *       500:
   *         description:
   */
  public uploadImageProduct = async ({ file }: Request, res: Response, next: NextFunction) => {
    try {
      const validateErrors = validate((file as any)?.location, uploadImageProductSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, httpStatus.BAD_REQUEST);
      }
      return res.status(httpStatus.OK).send(buildSuccessMessage({ path: (file as any).location }));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   CreateAppointmentDetail:
   *       required:
   *           - serviceId
   *           - resourceId
   *           - staffIds
   *           - startTime
   *       properties:
   *           serviceId:
   *               type: string
   *           resourceId:
   *               type: string
   *           staffIds:
   *               type: array
   *               items:
   *                   type: string
   *           startTime:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *
   */

  /**
   * @swagger
   * definitions:
   *   CreateProduct:
   *       required:
   *           - itemCode
   *           - name
   *           - categoryIds
   *           - salePrice
   *       properties:
   *           locationId:
   *               type: string
   *           bookingSource:
   *               type: string
   *           customerWisereId:
   *               type: string
   *           appointmentGroupId:
   *               type: string
   *           relatedAppointmentId:
   *               type: string
   *           date:
   *               type: string
   *               format: date-time
   *               description: YYYY-MM-DD HH:mm:ss
   *           appointmentDetails:
   *               type: array
   *               items:
   *                   $ref: '#/definitions/CreateAppointmentDetail'
   *
   */

  /**
   * @swagger
   * /product/create-product:
   *   post:
   *     tags:
   *       - Product
   *     security:
   *       - Bearer: []
   *     name: createProduct
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/CreateProduct'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad request - input invalid format, header is invalid
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server errors
   */
  public createProduct = async ({ body }: Request, res: Response, next: NextFunction) => {
    try {
      const data: any = {
        name: body.name,
        excerpt: body.excerpt,
        companyId: res.locals.staffPayload.companyId,
        color: body.color
      };
      return res.status(httpStatus.OK).send(buildSuccessMessage(data));
    } catch (error) {
      return next(error);
    }
  };
}
