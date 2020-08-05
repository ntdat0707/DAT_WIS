import { IBaseEmailTemplate } from './index';
interface IStaffRecoveryPasswordTemplate extends IBaseEmailTemplate {
  staffName: string;
  yourURL: string;
}
const staffRecoveryPasswordTemplate = `
    <h2>Hi {{staffName}},</h2>
    Đường dẫn lấy lại mật khẩu của bạn là {{yourURL}}
`;

export { staffRecoveryPasswordTemplate, IStaffRecoveryPasswordTemplate };
