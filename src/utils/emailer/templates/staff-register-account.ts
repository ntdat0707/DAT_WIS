import { IBaseEmailTemplate } from './index';

export interface IStaffRegisterAccountTemplate extends IBaseEmailTemplate {
  staffName: string;
  staffEmail: string;
}
