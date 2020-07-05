import * as nodemailer from 'nodemailer';
import mailgun from 'nodemailer-mailgun-transport';
require('dotenv').config();

interface IEmailOptions {
  receivers: string | string[];
  subject: string;
  type: 'text' | 'html';
  message: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email from process.env.EMAIL_USER to options.receivers
 *
 * @param {IEmailOptions} options
 * @returns {Promise<any>}
 */
const sendEmail = async (options: IEmailOptions): Promise<any> => {
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
    let bcc: string = null;
    if (options.bcc) bcc = Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc;

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
    if (cc) sendEmailOptions.cc = cc;
    if (bcc) sendEmailOptions.bcc = bcc;

    //send
    const info = await nodemailerMailgun.sendMail(sendEmailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

export { sendEmail, IEmailOptions };
