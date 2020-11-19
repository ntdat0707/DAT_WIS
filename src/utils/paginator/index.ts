import { Model } from 'sequelize';
// import { Client, SearchParams } from 'elasticsearch';
import { Client } from '@elastic/elasticsearch';
type NonAbstract<T> = { [P in keyof T]: T[P] };
type Constructor<T> = new () => T;
type NonAbstractTypeOfModel<T> = Constructor<T> & NonAbstract<typeof Model>;

interface IPaginateOptions {
  pageNum: number;
  pageSize: number;
}

interface IPagination {
  meta: {
    totalPages: number;
    totalRecords: number;
  };
  data: any;
  links: {
    self: string;
    first: string;
    prev: string;
    next: string;
    last: string;
  };
  _isPagination: boolean;
}
// /query
const paginate = async <T extends Model<T>>(
  model: NonAbstractTypeOfModel<T>,
  query: { [key: string]: any },
  paginateOptions: IPaginateOptions,
  currentUrl: string
): Promise<IPagination> => {
  try {
    //https://github.com/sequelize/sequelize/issues/8360
    //  clone query to find all
    const queryFindData: { [key: string]: any } = { ...query };
    const offset = paginateOptions.pageSize * (paginateOptions.pageNum - 1);
    queryFindData.offset = offset;
    queryFindData.limit = paginateOptions.pageSize;
    // queryFindData.distinct = true;

    // Count meta totalPages
    const totalRecords: number = await model.count({ ...query, ...{ distinct: true } });
    const totalPages: number = Math.ceil(totalRecords / paginateOptions.pageSize);

    // get data
    const data = await model.findAll(queryFindData);
    // const dataFinds = await model.findAndCountAll({ ...queryFindData, ...{ distinct: true } });
    // const data = dataFinds.rows;

    // calculate links
    let firstURL: URL = null;
    let prevURL: URL = null;
    let nextURL: URL = null;
    let lastURL: URL = null;

    if (Array.isArray(data) && data.length > 0) {
      //first
      firstURL = new URL(currentUrl);
      const firstPageSize = totalRecords > paginateOptions.pageSize ? paginateOptions.pageSize : totalRecords;
      firstURL.searchParams.set('pageNum', '1');
      firstURL.searchParams.set('pageSize', firstPageSize.toString());
      //prev
      if (paginateOptions.pageNum > 1) {
        prevURL = new URL(currentUrl);
        const prevPageNum = paginateOptions.pageNum - 1;
        prevURL.searchParams.set('pageNum', prevPageNum.toString());
        prevURL.searchParams.set('pageSize', paginateOptions.pageSize.toString());
      }

      // last
      lastURL = new URL(currentUrl);
      const lastPageNum = totalPages;
      const lastPageSize = totalRecords % (totalPages - 1) ? totalRecords % (totalPages - 1) : paginateOptions.pageSize;
      lastURL.searchParams.set('pageNum', lastPageNum.toString());
      lastURL.searchParams.set('pageSize', lastPageSize.toString());

      //next
      if (paginateOptions.pageNum < totalPages) {
        nextURL = new URL(currentUrl);
        const nextPageNum = paginateOptions.pageNum + 1;
        const nextPageSize = nextPageNum === totalPages ? lastPageSize : paginateOptions.pageSize;
        nextURL.searchParams.set('pageNum', nextPageNum.toString());
        nextURL.searchParams.set('pageSize', nextPageSize.toString());
      }
    }

    //prev
    const result: IPagination = {
      meta: {
        totalPages,
        totalRecords
      },
      data,
      links: {
        self: currentUrl,
        first: firstURL ? firstURL.href : null,
        prev: prevURL ? prevURL.href : null,
        next: nextURL ? nextURL.href : null,
        last: lastURL ? lastURL.href : null
      },
      _isPagination: true
    };
    return result;
  } catch (error) {
    throw error;
  }
};

const paginateRawData = <T extends Model<T>>(
  dataRaw: any[],
  paginateOptions: IPaginateOptions,
  currentUrl: string
): IPagination => {
  try {
    const offset = paginateOptions.pageSize * (paginateOptions.pageNum - 1);
    const limit = paginateOptions.pageSize * paginateOptions.pageNum;

    // Count meta totalPages
    const totalRecords: number = dataRaw.length;
    const totalPages: number = Math.ceil(totalRecords / paginateOptions.pageSize);

    // get data
    const data = dataRaw.slice(offset, limit);

    // calculate links
    let firstURL: URL = null;
    let prevURL: URL = null;
    let nextURL: URL = null;
    let lastURL: URL = null;

    if (Array.isArray(data) && data.length > 0) {
      //first
      firstURL = new URL(currentUrl);
      const firstPageSize = totalRecords > paginateOptions.pageSize ? paginateOptions.pageSize : totalRecords;
      firstURL.searchParams.set('pageNum', '1');
      firstURL.searchParams.set('pageSize', firstPageSize.toString());
      //prev
      if (paginateOptions.pageNum > 1) {
        prevURL = new URL(currentUrl);
        const prevPageNum = paginateOptions.pageNum - 1;
        prevURL.searchParams.set('pageNum', prevPageNum.toString());
        prevURL.searchParams.set('pageSize', paginateOptions.pageSize.toString());
      }

      // last
      lastURL = new URL(currentUrl);
      const lastPageNum = totalPages;
      const lastPageSize = totalRecords % (totalPages - 1) ? totalRecords % (totalPages - 1) : paginateOptions.pageSize;
      lastURL.searchParams.set('pageNum', lastPageNum.toString());
      lastURL.searchParams.set('pageSize', lastPageSize.toString());

      //next
      if (paginateOptions.pageNum < totalPages) {
        nextURL = new URL(currentUrl);
        const nextPageNum = paginateOptions.pageNum + 1;
        const nextPageSize = nextPageNum === totalPages ? lastPageSize : paginateOptions.pageSize;
        nextURL.searchParams.set('pageNum', nextPageNum.toString());
        nextURL.searchParams.set('pageSize', nextPageSize.toString());
      }
    }

    //prev
    const result: IPagination = {
      meta: {
        totalPages,
        totalRecords
      },
      data,
      links: {
        self: currentUrl,
        first: firstURL ? firstURL.href : null,
        prev: prevURL ? prevURL.href : null,
        next: nextURL ? nextURL.href : null,
        last: lastURL ? lastURL.href : null
      },
      _isPagination: true
    };
    return result;
  } catch (error) {
    throw error;
  }
};

const paginateElasticSearch = async <T extends Model<T>>(
  client: Client,
  searchParams: any,
  paginateOptions: IPaginateOptions,
  currentUrl: string
): Promise<IPagination> => {
  try {
    const from = paginateOptions.pageSize * (paginateOptions.pageNum - 1);
    const size = paginateOptions.pageSize * paginateOptions.pageNum;

    if (searchParams.body) {
      searchParams.body.from = from;
      searchParams.body.size = size;
    } else {
      searchParams.body = { from, size };
    }

    //searchParams.ignore = [404];

    if (searchParams.body.sort) {
      searchParams.body.sort.push('_score');
    } else {
      searchParams.body.sort = ['_score'];
    }
    let data: any = await client.search(searchParams);
    // Count meta totalPages
    const totalRecords: number = data.body.hits.total.value;
    const totalPages: number = Math.ceil(totalRecords / paginateOptions.pageSize);
    data = data.body?.hits?.hits.map((item: any) => item._source) || [];

    // calculate links
    let firstURL: URL = null;
    let prevURL: URL = null;
    let nextURL: URL = null;
    let lastURL: URL = null;

    if (Array.isArray(data) && data.length > 0) {
      //first
      firstURL = new URL(currentUrl);
      const firstPageSize = totalRecords > paginateOptions.pageSize ? paginateOptions.pageSize : totalRecords;
      firstURL.searchParams.set('pageNum', '1');
      firstURL.searchParams.set('pageSize', firstPageSize.toString());
      //prev
      if (paginateOptions.pageNum > 1) {
        prevURL = new URL(currentUrl);
        const prevPageNum = paginateOptions.pageNum - 1;
        prevURL.searchParams.set('pageNum', prevPageNum.toString());
        prevURL.searchParams.set('pageSize', paginateOptions.pageSize.toString());
      }

      // last
      lastURL = new URL(currentUrl);
      const lastPageNum = totalPages;
      const lastPageSize = totalRecords % (totalPages - 1) ? totalRecords % (totalPages - 1) : paginateOptions.pageSize;
      lastURL.searchParams.set('pageNum', lastPageNum.toString());
      lastURL.searchParams.set('pageSize', lastPageSize.toString());

      //next
      if (paginateOptions.pageNum < totalPages) {
        nextURL = new URL(currentUrl);
        const nextPageNum = paginateOptions.pageNum + 1;
        const nextPageSize = nextPageNum === totalPages ? lastPageSize : paginateOptions.pageSize;
        nextURL.searchParams.set('pageNum', nextPageNum.toString());
        nextURL.searchParams.set('pageSize', nextPageSize.toString());
      }
    }

    //prev
    const result: IPagination = {
      meta: {
        totalPages,
        totalRecords
      },
      data,
      links: {
        self: currentUrl,
        first: firstURL ? firstURL.href : null,
        prev: prevURL ? prevURL.href : null,
        next: nextURL ? nextURL.href : null,
        last: lastURL ? lastURL.href : null
      },
      _isPagination: true
    };
    return result;
  } catch (error) {
    throw error;
  }
};

export { paginate, paginateRawData, paginateElasticSearch, IPagination, IPaginateOptions };
