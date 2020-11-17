import * as nodemailer from 'nodemailer';
import mailgun from 'nodemailer-mailgun-transport';
require('dotenv').config();

import { emit, EQueueNames } from '../event-queues';

interface IEmailOptions {
  receivers: string | string[];
  subject: string;
  type: 'text' | 'html';
  message: string;
  cc?: string | string[];
}

function isEmailOptions(options: object): options is IEmailOptions {
  return (
    (options as IEmailOptions).receivers &&
    (typeof (options as IEmailOptions).receivers === 'string' || Array.isArray((options as IEmailOptions).receivers)) &&
    (options as IEmailOptions).subject &&
    typeof (options as IEmailOptions).subject === 'string' &&
    (options as IEmailOptions).type &&
    ['text', 'html'].includes((options as IEmailOptions).type) &&
    (options as IEmailOptions).message &&
    typeof (options as IEmailOptions).message === 'string' &&
    (!(options as IEmailOptions).cc ||
      ((options as IEmailOptions).cc &&
        (typeof (options as IEmailOptions).cc === 'string' || Array.isArray((options as IEmailOptions).cc))))
  );
}

/**
 * Push Email data <IEmailOptions> to message queue
 * return true if send push successful, return false if options is not IEmailOptions
 *
 * @param {IEmailOptions} options
 * @returns {Promise<boolean>}
 */
const sendEmail = async (options: IEmailOptions): Promise<boolean> => {
  try {
    if (isEmailOptions(options)) {
      await emit(EQueueNames.EMAIL, options);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Send Email
 *
 * @param {IEmailOptions} options
 * @returns {Promise<any>}
 */
const executeSendingEmail = async (options: IEmailOptions): Promise<any> => {
  try {
    const info = await sendEmailViaNodemailer(options);
    return info;
  } catch (error) {
    throw error;
  }
};
const sendEmailViaNodemailer = async (options: IEmailOptions): Promise<any> => {
  try {
    const receivers: string = Array.isArray(options.receivers) ? options.receivers.join(',') : options.receivers;
    let cc: string = null;
    if (options.cc) cc = Array.isArray(options.cc) ? options.cc.join(',') : options.cc;
    const auth = {
      auth: {
        api_key: process.env.MAIL_GUN_API_KEY,
        domain: process.env.MAIL_GUN_DOMAIN
      }
      // proxy: 'http://user:pass@localhost:8080' // optional proxy, default is false
    };
    const nodemailerMailgun = nodemailer.createTransport(mailgun(auth));

    const sendEmailOptions: {
      from: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
      cc?: string;
      bcc?: string;
    } = {
      from: `${process.env.MAILGUN_SENDER_NAME} <${process.env.MAIL_GUN_SENDING_EMAIL}>`,
      to: receivers,
      subject: options.subject
    };
    if (options.type === 'html') {
      sendEmailOptions.html = options.message;
    } else {
      sendEmailOptions.text = options.message;
    }
    if (cc) {
      sendEmailOptions.cc = cc;
    }

    //send
    const info = await nodemailerMailgun.sendMail(sendEmailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

export { sendEmail, IEmailOptions, executeSendingEmail };
