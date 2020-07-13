import { IBaseEmailTemplate } from './index';
interface IVerifyEmailTemplate extends IBaseEmailTemplate {
  name: string;
  link: string;
}

const verifyEmailTemplate = 'dddd';

export { IVerifyEmailTemplate, verifyEmailTemplate };
