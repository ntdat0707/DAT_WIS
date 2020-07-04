import * as nodemailer from 'nodemailer';
require('dotenv').config();

interface IEmailOptions {
  receivers: string | string[];
  subject: string;
  type: 'text' | 'html';
  message: string;
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
    var transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const sendEmailOptions: { from: string; to: string; subject: string; html?: string; text?: string } = {
      from: process.env.EMAIL_USER,
      to: receivers,
      subject: options.subject
    };
    if (options.type === 'html') {
      sendEmailOptions.html = options.message;
    } else {
      sendEmailOptions.text = options.message;
    }

    //send
    const info = await transporter.sendMail(sendEmailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

export { sendEmail, IEmailOptions };
