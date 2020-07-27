import handlebars from 'handlebars';
import { sampleTemplate, ISampleTemplate } from './sample';
import { verifyEmailTemplate, IVerifyEmailTemplate } from './customer';
// you can import your templates here

interface IBaseEmailTemplate {
  [name: string]: any;
}
/**
 * Build a HTML template
 *
 * @param {string} source
 * @param {IBaseEmailTemplate} data
 * @returns {string}
 */
const buildEmailTemplate = (source: string, data: IBaseEmailTemplate): string => {
  let template = handlebars.compile(source);
  let result = template(data);
  return result;
};

export {
  buildEmailTemplate,
  IBaseEmailTemplate,
  ISampleTemplate,
  sampleTemplate,
  verifyEmailTemplate,
  IVerifyEmailTemplate
};
