import { IBaseEmailTemplate } from './index';
export interface ICustomerRecoveryPasswordTemplate extends IBaseEmailTemplate {
  customerEmail: string;
  yourURL: string;
}
