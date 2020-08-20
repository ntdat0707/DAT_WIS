import { IBaseEmailTemplate } from './index';

export interface ICustomerRegisterAccountTemplate extends IBaseEmailTemplate {
  customerName: string;
  customerEmail: string;
  password: string;
}
