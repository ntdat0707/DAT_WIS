import { IBaseEmailTemplate } from './index';
export interface IStaffRecoveryPasswordTemplate extends IBaseEmailTemplate {
  staffEmail: string;
  yourURL: string;
}
