import { promisify } from 'util';
import EKeys from './keys';
import redisClient from './connector';

const setASync = promisify(redisClient.set).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

const setData = async (key: EKeys, data: any, options: any = null) => {
  try {
    if (options != null) {
      await setASync(key, data, options.key, options.value);
    } else {
      await setASync(key, data);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

const getData = async (key: EKeys) => {
  try {
    const data = await getAsync(key);
    return data;
  } catch (error) {
    throw error;
  }
};

const deleteData = async (key: EKeys) => {
  try {
    await delAsync(key);
  } catch (error) {
    throw error;
  }
};

interface IRedisActions {
  setData(key: EKeys, data: any, options: any): Promise<any>;
  getData(key: EKeys): Promise<any>;
  deleteData(key: EKeys): Promise<void>;
}

const redis: IRedisActions = { setData, getData, deleteData };
export default redis;
