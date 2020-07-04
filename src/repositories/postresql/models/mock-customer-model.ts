import { v4 as uuidv4 } from 'uuid';
//(node:14062) ExperimentalWarning: Conditional exports is an experimental feature. This feature could change at any time

interface IMockCustomer {
  id?: string;
  name: string;
  email: string;
  age: number;
  password: string;
}

const customers: IMockCustomer[] = [
  {
    id: '9bb42376-af11-11ea-b3de-0242ac130004',
    name: 'Trọng cute',
    email: 'trongcute@gmail.com',
    age: 69,
    password: 'abc'
  },
  {
    id: '9bb425ba-af11-11ea-b3de-0242ac130004',
    name: 'Tèo',
    email: 'teo@gmail.com',
    age: 96,
    password: 'abc'
  }
];

class MockCustomerModel {
  public id: number;
  public name: string;
  public email: string;
  public age: number;

  // mock a promise
  public create = async (customer: IMockCustomer): Promise<IMockCustomer> => {
    const newUser = { ...customer, id: uuidv4() };
    customers.push(newUser);
    return newUser;
  };

  // mock a promsie find customer  by id
  public getById = async (id: string): Promise<IMockCustomer> => {
    return customers.find(e => e.id === id);
  };

  public login = async (email: string, password: string): Promise<IMockCustomer> => {
    return customers.find(e => e.email === email && e.password === password);
  };
}

export default new MockCustomerModel();
