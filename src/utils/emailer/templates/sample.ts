import { IBaseEmailTemplate } from './index';
interface ISampleTemplate extends IBaseEmailTemplate {
  customerName: string;
}
const sampleTemplate = `
    <h2>Hi {{customerName}},</h2>
`;

export { sampleTemplate, ISampleTemplate };
