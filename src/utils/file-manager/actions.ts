import { Request, NextFunction, Response } from 'express';
import s3Storage from 'multer-s3';
import S3 from 'aws-sdk/clients/s3';
import path from 'path';
import multer from 'multer';
import HttpStatus from 'http-status-codes';
import shortid from 'shortid';
require('dotenv').config();

import { generalErrorDetails, IErrorDetail, buildErrorMessage, buildErrorDetail } from '../response-messages';
import { logger } from '../logger';
import { EFileTypes, FileExtensions, EFileACL } from './configs';

interface UploadFields {
  name: string;
  maxCount: number;
}
const LOG_LABEL = process.env.NODE_NAME || 'development-mode';

const makeStorage = (permission: EFileACL) => {
  const s3 = new S3({
    endpoint: process.env.DO_SPACES_END_POINT,
    accessKeyId: process.env.DO_SPACES_ACESS_KEY_ID,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY
  });
  const multerS3 = s3Storage({
    s3,
    bucket: process.env.DO_SPACES_BUCKET,
    acl: permission,
    key(_request, file, cb) {
      //   console.log(file);
      cb(null, shortid.generate() + shortid.generate() + '-' + file.originalname);
    }
  });
  return multerS3;
};

/**
 * Check file extension
 *
 * @param {Express.Multer.File} file
 * @param {((error: Error | null, acceptFile: boolean) => void)} cb
 * @returns {void}
 */
function checkFile(
  file: Express.Multer.File,
  type: EFileTypes,
  cb: (error: IErrorDetail | null, acceptFile: boolean) => void
): void {
  const fileTypes = FileExtensions[type];
  const isValidType = fileTypes.includes(path.extname(file.originalname).toLowerCase().split('.').pop());
  if (isValidType) {
    return cb(null, true);
  } else {
    const allowedFileTypes = fileTypes.join(', ');
    const err = generalErrorDetails.E_0006(`Only accept file types ${allowedFileTypes}`);
    return cb(err, false);
  }
}

function isErrorDetail(data: object): data is IErrorDetail {
  return (
    (data as IErrorDetail).title &&
    typeof (data as IErrorDetail).title === 'string' &&
    (data as IErrorDetail).detail &&
    typeof (data as IErrorDetail).detail === 'string'
  );
}

function isUploadFields(data: any): data is UploadFields {
  return (
    (data as UploadFields).name &&
    typeof (data as UploadFields).name === 'string' &&
    (data as UploadFields).maxCount &&
    typeof (data as UploadFields).maxCount === 'number'
  );
}

function isArrayOfUploadFields(data: any): data is UploadFields[] {
  if (!Array.isArray(data)) return false;
  for (let i = 0; i < data.length; i++) {
    const isValid = isUploadFields(data[i]);
    if (!isValid) return false;
  }
  return true;
}

/**
 * Upload file to Digital Ocean Spaces
 *
 * @param {(string | UploadFields | Array<UploadFields>)} file
 * @param {EFileTypes} [fileType=EFileTypes.IMAGE]
 * @param {EFileACL} [permission=EFileACL.PUBLIC_READ]
 * @param {number} [fileSize=Infinity]
 * @returns {*}
 */
const uploadAsMiddleware = (
  file: string | UploadFields | UploadFields[],
  fileType: EFileTypes = EFileTypes.IMAGE,
  permission: EFileACL = EFileACL.PUBLIC_READ,
  fileSize: number = Infinity
): any => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const multerInstance = multer({
      storage: makeStorage(permission),
      //tslint:disable-next-line
      fileFilter(_req, file: Express.Multer.File, cb) {
        checkFile(file, fileType, cb as any);
      },
      limits: { fileSize }
    });

    let upload;
    if (isUploadFields(file)) {
      upload = multerInstance.array(file.name, file.maxCount);
    } else if (isArrayOfUploadFields(file)) {
      upload = multerInstance.fields(file);
    } else {
      upload = multerInstance.single(file);
    }

    upload(req, res, (err: any) => {
      if (err) {
        if (isErrorDetail(err)) {
          logger.error({ label: LOG_LABEL, message: JSON.stringify(err) });
          return res.status(HttpStatus.BAD_REQUEST).send(buildErrorMessage(err));
        } else {
          const e = buildErrorDetail('0001', 'Internal server error', err.message || '');
          logger.error({ label: LOG_LABEL, message: JSON.stringify(e) });
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(buildErrorMessage(generalErrorDetails.E_0001(err)));
        }
      }
      next();
    });
  };
};

export { UploadFields, uploadAsMiddleware };
