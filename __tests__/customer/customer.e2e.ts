import 'jest-extended';
import { request as callAPI } from '../../src/ultils/request';
const alphabet = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'v',
  'x',
  'y',
  'z '
];
var randomText: string = '';
for (let i = 0; i < 10; i++) {
  let index = Math.floor(Math.random() * 20) + 1;
  randomText += alphabet[index];
}
const randomEmail = randomText + '@mail.com';

beforeAll(async () => {
  // This hook excutes before run test cases
});
jest.setTimeout(50000);

describe('Register Customer', () => {
  const expectedFailedResult = {
    isSuccess: false,
    error: expect.toBeObject()
  };
  const expectedSuccessResult = {
    isSuccess: true,
    data: expect.toBeObject()
  };
  // Missing Email should be fail
  test('Missing email must be fail', async () => {
    const data = {
      name: 'test',
      password: 'MyPass123!'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedFailedResult);
  });

  //Invalid Email
  test('Email invalid format should be fail', async () => {
    const data = {
      email: 'invalidEmail',
      name: 'test',
      password: 'MyPass123!'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedFailedResult);
  });

  //Missing name
  test('Missing name should be fail', async () => {
    const data = {
      email: 'somgthing@gmail.com',
      password: 'MyPass123!'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedFailedResult);
  });

  // Missing password should be fail
  test('Missing password should be fail', async () => {
    const data = {
      email: 'somgthing@gmail.com',
      name: 'MrA'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedFailedResult);
  });

  // Password invalid format
  test('Missing password should be fail', async () => {
    const data = {
      email: 'somgthing@gmail.com',
      name: 'MrA',
      password: '123'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedFailedResult);
  });

  // Succesful case
  test('Succesful case', async () => {
    const data = {
      email: randomEmail,
      name: 'MrA',
      password: 'MyPass123!'
    };
    const result = await callAPI({ method: 'post', url: '/customer/register', data });
    expect(result.response).toMatchObject(expectedSuccessResult);
  });
});
