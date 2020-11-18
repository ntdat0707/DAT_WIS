import { sendRequest } from '../index';
import moment from 'moment';


enum EType {
  FUNCTION = 'function',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  ARRAY = 'array',
  OBJECT = 'object',
  UNDEFINED = 'undefined'
};

const formatDate = (date: Date): string  => {
  return moment(date).format('YYYY-MM-DD HH:MM:SS');
};

/**
 * Add new phones to address book
 *
 * @param addressBookId
 * @param phones
 */
const addPhones = async (addressBookId: string, phones: string[]) => {
    return await sendRequest({
      path: 'sms/numbers',
      method: 'post',
      data: {
        addressBookId,
        phones
      }
    });
};


/**
 * Update phones variables from the address book
 *
 * @param addressBookId
 * @param phones
 * @param variables
 */
const updatePhonesVariables = async (
  addressBookId: string,
  phones: string[],
  variables: {
    name: string,
    type: EType,
    value: any
  }[]
) => {
    return await sendRequest({
      path: 'sms/numbers',
      method: 'put',
      data: {
        addressBookId,
        phones,
        variables
      }
    });
};



/**
 * Remove phones from address book
 *
 * @param addressBookId
 * @param phones
 */
const removePhones = async (addressBookId: string, phones: string[]) => {
    return await sendRequest({
      path: 'sms/numbers',
      method: 'delete',
      data: {
        addressBookId,
        phones
      }
    });
};


/**
 * Add new phones to address book with variables
 *
 * @param addressbook_id
 * @param phones
 */
const addPhonesWithVariables = async (addressBookId: string, phones: string[]) => {
    return await sendRequest({
      path: 'sms/numbers/variables',
      method: 'post',
      data: {
        addressBookId,
        phones
      }
    });
};

/**
 * Get information about phone from the address book
 *
 * @param addressBookId
 * @param phone
 */
const getPhoneInfo = async (addressBookId: string, phone: string) =>  {
    return await sendRequest({
      path: `sms/numbers/info/${addressBookId}/${phone}`,
      method: 'get'
    });
};

/**
 * Get info by phones from the blacklist
 *
 * @param phones
 */
const getPhonesInfoFromBlacklist = async (phones: string[]) => {
    return await sendRequest({
      path: 'sms/black_list/by_numbers',
      method: 'get',
      data: {
        phones
      }
    });
};


/**
 * Get all phones from blacklist
 *
 */
const getBlackList = async () => {
    return sendRequest({
      path: 'sms/black_list',
      method: 'get'
    });
};

/**
 * Add phones to blacklist
 *
 * @param phones
 * @param comment
 */
const addPhonesToBlacklist = async (phones: string[], comment: string) =>  {
    return await sendRequest({
      path: 'sms/black_list',
      method: 'post',
      data: {
        phones,
        description: comment,
      }
    });
};

/**
 * Remove phones from blacklist
 *
 * @param phones
 */
const deletePhonesFromBlacklist = async (phones: string[]) => {
    return await sendRequest({
      path: 'sms/black_list',
      method: 'delete',
      data: {
        phones
      }
    });
};

/**
 * Create new sms campaign
 *
 * @param senderName
 * @param addressBookId
 * @param body
 * @param date
 * @param transliterate
 */
const addCampaign = async (
  senderName: string,
  addressBookId: string,
  body: string,
  date: Date,
  transliterate: 0 | 1
) =>  {
    return await sendRequest({
      path: 'sms/campaigns',
      method: 'post',
      data: {
        sender: senderName,
        addressBookId,
        body,
        date: formatDate(date),
        transliterate
      }
    });

};

/**
 * Send sms by some phones
 *
 * @param senderName
 * @param phones
 * @param body
 * @param date
 * @param transliterate
 * @param route
 */
const send = async (
  senderName: string,
  phones: string,
  body: string,
  date: Date,
  transliterate: 0 | 1 ,
  route: any
) => {
    return await sendRequest({
      path: 'sms/send',
      method: 'post',
      data: {
        sender: senderName,
        phones,
        body,
        date: formatDate(date),
        transliterate,
        route
      }
    });
};

/**
 * Get list of campaigns
 *
 * @param dateFrom
 * @param dateTo
 */
const getListCampaigns = async (dateFrom: Date, dateTo: Date) => {
    return await sendRequest({
      path: 'sms/campaigns/list',
      method: 'get',
      data: {
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo)
      }
    });
};

/**
 * Get information about sms campaign
 *
 * @param campaignId
 */
const getCampaignInfo = async (campaignId: string) => {
    return await sendRequest({
      path: `sms/campaigns/info/${campaignId}`,
      method: 'get'
    });
};

/**
 * Cancel sms campaign
 *
 * @param campaignId
 */
const cancelCampaign = async (campaignId: string) => {
    return await sendRequest({
      path: `sms/campaigns/cancel/${campaignId}`,
      method: 'put'
    });
};

/**
 * Get cost sms campaign
 *
 * @param senderName
 * @param body
 * @param addressBookId
 * @param phones
 */
const getCampaignCost = async (
  senderName: string,
  body: string,
  addressBookId: string,
  phones: string[]
) => {
    const data: any = {
        sender: senderName,
        body,
        addressBookId
    };
    if (phones.length) {
        data.phones = phones;
    }
    return sendRequest({
      path: 'sms/campaigns/cost',
      method: 'get',
      data
    });
};

/**
 * Remove sms campaign
 *
 * @param campaignId
 */
const deleteCampaign = async (campaignId: string) => {
    return await sendRequest({
      path: 'sms/campaigns',
      method: 'delete',
      data: {
        campaignId
      }
    });
};

export {
  addPhones,
  addPhonesWithVariables,
  removePhones,
  getBlackList,
  getPhoneInfo,
  updatePhonesVariables,
  getPhonesInfoFromBlacklist,
  addPhonesToBlacklist,
  deletePhonesFromBlacklist,
  addCampaign,
  send,
  getListCampaigns,
  getCampaignInfo,
  cancelCampaign,
  getCampaignCost,
  deleteCampaign
};
