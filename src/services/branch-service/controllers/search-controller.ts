import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
require('dotenv').config();
import { validate, baseValidateSchemas } from '../../../utils/validator';
import { CustomError } from '../../../utils/error-handlers';
// import { customerErrorDetails } from '../../../utils/response-messages/error-details';
import { buildSuccessMessage } from '../../../utils/response-messages';
import {
  sequelize,
  LocationModel,
  CompanyModel,
  CateServiceModel,
  ServiceModel,
  LocationWorkingHourModel,
  CompanyDetailModel,
  CustomerSearchModel,
  StaffModel,
  CustomerModel,
  RecentBookingModel,
  MarketPlaceFieldsModel,
  MarketPlaceValueModel,
  CityModel,
  CountryModel
} from '../../../repositories/postgres/models';

import { searchSchema, suggestedSchema, getLocationMarketPlace } from '../configs/validate-schemas';
import { FindOptions, Op, Sequelize, QueryTypes } from 'sequelize';
import { paginate } from '../../../utils/paginator';
import _ from 'lodash';
import { EOrder } from '../../../utils/consts';
import { LocationImageModel } from '../../../repositories/postgres/models/location-image';
import { v4 as uuidv4 } from 'uuid';
import { LocationServiceModel } from '../../../repositories/postgres/models/location-service';
import { removeAccents } from '../../../utils/text';
import { RecentViewModel } from '../../../repositories/postgres/models/recent-view-model';
import {parseDatabyField} from '../utils';

export class SearchController {
  private calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const toRad = (value: number) => (value * Math.PI) / 180; // Converts numeric degrees to radians
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  /**
   * @swagger
   * /branch/location/market-place/search:
   *   get:
   *     tags:
   *       - Branch
   *     name: marketPlaceSearch
   *     parameters:
   *     - in: query
   *       name: keyword
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageNum
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageSize
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: latitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: longitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: cityCode
   *       schema:
   *          type: string
   *     - in: query
   *       name: countryCode
   *       schema:
   *          type: string
   *     - in: query
   *       name: customerId
   *       schema:
   *          type: string
   *     - in: query
   *       name: order
   *       schema:
   *          type: string
   *          enum: [ nearest, newest, price_lowest, price_highest ]
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public marketPlaceSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // let locations: any[] = [];
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      const trimSpace = (text: string) =>
        text
          .split(' ')
          .filter((x: string) => x)
          .join(' ');
      const search = {
        keywords: trimSpace(req.query.keyword ? req.query.keyword.toString() : ''),
        customerId: req.query.customerId,
        latitude: req.query.latitude,
        longitude: req.query.longitude,
        cityName: req.query.cityName,
        order: req.query.order
      };

      const validateErrorsSearch = validate(search, searchSchema);
      if (validateErrorsSearch) {
        return next(new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST));
      }
      console.log('CheckedValidate:::');
      const keywords: string = (search.keywords || '') as string;
      let keywordsQuery: string = '';
      if (!keywords) {
        keywordsQuery = '\'%%\'';
      } else {
        keywordsQuery = `unaccent('%${keywords}%')`;
      }

      const queryLocations: FindOptions = {
        include: [
          {
            model: MarketPlaceValueModel,
            as: 'marketplaceValues',
            required: false,
            attributes: { exclude: ['id', 'createdAt', 'updateAt', 'deletedAt'] },
            include: [
              {
                model: MarketPlaceFieldsModel,
                as: 'marketplaceField',
                required: false,
                attributes: { exclude: ['id', 'createdAt', 'updateAt', 'deletedAt'] }
              }
            ]
          },
          {
            model: CityModel,
            as: 'cityy',
            required: true,
            attributes: { exclude: ['id', 'createdAt', 'updateAt', 'deletedAt'] },
            include: [
              {
                model: CountryModel,
                as: 'country',
                required: true,
                attributes: { exclude: ['id', 'createdAt', 'updateAt', 'deletedAt'] },
              }
            ]
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false,
            attributes: ['path', 'is_avatar']
          },
          {
            model: CompanyModel,
            as: 'company',
            required: false,
            attributes: ['id'],
            include: [
              {
                model: CateServiceModel,
                as: 'cateServices',
                required: false,
                attributes: ['id', 'name']
              },
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: true,
                attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] }
              }
            ]
          },
          {
            model: ServiceModel,
            as: 'services',
            required: false,
            attributes: { exclude: ['LocationServiceModel', 'createdAt', 'updatedAt', 'deletedAt'] },
            where: {
              [Op.and]: [
                Sequelize.literal(`unaccent("services"."name") ilike any(array[${keywordsQuery}])`),
                Sequelize.literal('"company->cateServices"."id" = "services"."cate_service_id"')
              ]
            }
          }
        ],
        where: {
          [Op.or]: [
            Sequelize.literal(`unaccent("services"."name") ilike any(array[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company->cateServices"."name") ilike any(array[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("company->companyDetail"."business_name") ilike any(array[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("LocationModel"."address") ilike any(array[${keywordsQuery}])`),
            Sequelize.literal(`unaccent("LocationModel"."name") ilike any(array[${keywordsQuery}])`)
          ]
        },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        group: [
          'LocationModel.id',
          'marketplaceValues.id',
          'cityy.id',
          'cityy->country.id',
          'marketplaceValues->marketplaceField.id',
          'locationImages.id',
          'services.id',
          'services->LocationServiceModel.id',
          'locationImages.path',
          'locationImages.is_avatar',
          'company.id',
          'company->cateServices.id',
          'company->companyDetail.id'
        ]
      };

      if (req.query.cityName) {
        queryLocations.where = {
          ...queryLocations.where,
          city: {
            [Op.iLike]: `%${search.cityName}%`
          }
        };
      }

      console.log('BEFOREDIEE');
      if (req.query.order === EOrder.NEWEST) {
        queryLocations.order = [['"LocationModel"."openedAt"', 'DESC']];
      }

      let locationResults: any = await LocationModel.findAll(queryLocations);
      const keywordUnaccents = removeAccents(keywords).toLowerCase();

      let searchCateServiceItem: any = {};
      let searchCompanyItem: any = {};
      let searchServiceItem: any = {};
      let searchLocationItem: any = {};

      locationResults = locationResults.map((location: any) => {
        location = location.dataValues;
        if (location.name && removeAccents(location.name).toLowerCase().search(keywordUnaccents)) {
          searchLocationItem = location;
        }

        if (location.company) {
          location.company = location.company.dataValues;
          if (
            location.company.businessName &&
            removeAccents(location.company.businessName).toLowerCase().search(keywordUnaccents)
          ) {
            searchCompanyItem = location.company;
          }

          if (
            location.services &&
            !_.isEmpty(location.services) &&
            location.services[0].name &&
            removeAccents(location.services[0].name).toLowerCase().search(keywordUnaccents)
          ) {
            searchServiceItem = location.services[0];
          }

          if (location.company.cateServices && Array.isArray(location.company.cateServices)) {
            location.company.cateServices.map((cateService: any) => {
              cateService = cateService.dataValues;
              if (removeAccents(cateService.name).toLowerCase().search(keywordUnaccents)) {
                searchCateServiceItem = cateService;
              }
              return cateService;
            });
            location.company.cateServices = undefined;
          }
        }
        const locationDetail = location.marketplaceValues.reduce((
          acc: any,
          {value, marketplaceField: {name, type} }: any
        ) => ({
          ...acc,
          [name]: parseDatabyField[type](value)
        }), {});

        location = {
          ...location,
          ...location.locationImages?.dataValues,
          ...locationDetail,
          company: {
            ...location.company?.dataValues,
            ...location.company?.companyDetail.dataValues,
            companyDetail: undefined
          },
          service: (location.services || [])[0],
          marketplaceValues: undefined,
          services: undefined,
          locationDetail: undefined
        };

        return location;
      });

      if (search.latitude && search.longitude && !Number.isNaN(+search.latitude) && !Number.isNaN(+search.longitude)) {
        const latitude: number = +search.latitude;
        const longitude: number = +search.longitude;
        locationResults = locationResults.map((location: any) => {
          location.distance = this.calcCrow(latitude, longitude, location.latitude, location.longitude).toFixed(2);
          location.unitOfLength = 'kilometers';
          return location;
        });

        if (search.order === EOrder.NEAREST) {
          locationResults = locationResults.sort((locationX: any, locationY: any) => {
            return locationX.distance - locationY.distance;
          });
        }
      }

      if (search.order === EOrder.PRICE_LOWEST) {
        locationResults = locationResults.sort((locationX: any, locationY: any) => {
          if (!locationX.service) {
            return 1;
          }
          if (!locationY.service) {
            return -1;
          }
          return locationX.service.salePrice - locationY.service.salePrice;
        });
      }

      if (search.order === EOrder.PRICE_HIGHEST) {
        locationResults = locationResults.sort((locationX: any, locationY: any) => {
          if (!locationX.service) {
            return 1;
          }
          if (!locationY.service) {
            return -1;
          }
          return locationY.service.salePrice - locationX.service.salePrice;
        });
      }

      const locationIds = locationResults.map((item: any) => item.id);
      const query: FindOptions = {
        where: {
          id: {
            [Op.in]: locationIds
          }
        }
      };

      if (search.customerId && search.keywords) {
        req.query = {
          ...req.query,
          ...search
        };
        let typeResult = null;
        let cateServiceId = null;
        let companyId = null;
        let serviceId = null;
        let locationId = null;
        if (!_.isEmpty(searchCateServiceItem)) {
          cateServiceId = searchCateServiceItem.id;
          typeResult = 'cateService';
        } else if (!_.isEmpty(searchCompanyItem)) {
          companyId = searchCompanyItem.id;
          typeResult = 'company';
        } else if (!_.isEmpty(searchServiceItem)) {
          serviceId = searchServiceItem.id;
          typeResult = 'service';
        } else if (!_.isEmpty(searchLocationItem)) {
          locationId = searchLocationItem.id;
          typeResult = 'location';
        }
        await this.createCustomerSearch(
          req,
          {
            cateServiceId,
            companyId,
            serviceId,
            locationId
          },
          typeResult
        );
      }

      const locations = await paginate(
        LocationModel,
        query,
        { pageNum: Number(paginateOptions.pageNum), pageSize: Number(paginateOptions.pageSize) },
        fullPath
      );

      locations.data = this.paginate(
        locationResults,
        Number(paginateOptions.pageSize),
        Number(paginateOptions.pageNum)
      );

      return res.status(HttpStatus.OK).send(buildSuccessMessage(locations));
    } catch (error) {
      return next(error);
    }
  };

  private paginate = (array: any[], pageSize: number, pageNumber: number) => {
    return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  };

  private createCustomerSearch = async (
    req: Request,
    searchItem: {
      serviceId?: string;
      companyId?: string;
      locationId?: string;
      cateServiceId?: string;
    },
    typeResult: string
  ) => {
    try {
      const customerSearch: any = {
        id: uuidv4(),
        customerId: req.query.customerId,
        keywords: req.query.keywords,
        serviceId: searchItem.serviceId,
        cateServiceId: searchItem.cateServiceId,
        locationId: searchItem.locationId,
        companyId: searchItem.companyId,
        type: typeResult,
        latitude: req.query.latitude,
        longitude: req.query.longitude
      };
      await CustomerSearchModel.create(customerSearch);
    } catch (error) {
      throw error;
    }
  };

  /**
   * @swagger
   * /branch/location/get-location-by-service-provider:
   *   get:
   *     tags:
   *       - Branch
   *     name: getLocationByServiceProvider
   *     parameters:
   *     - in: query
   *       name: keyword
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageNum
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: pageSize
   *       required: true
   *       schema:
   *          type: integer
   *     - in: query
   *       name: la titude
   *       schema:
   *          type: number
   *     - in: query
   *       name: longitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: cityName
   *       schema:
   *          type: string
   *     - in: query
   *       name: customerId
   *       schema:
   *          type: string
   *     - in: query
   *       name: order
   *       schema:
   *          type: string
   *          enum: [ nearest, newest, price_lowest, price_highest ]
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public getLocationByServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await this.marketPlaceSearch(req, res, next);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/suggested:
   *   get:
   *     tags:
   *       - Branch
   *     name: marketPlaceSuggested
   *     parameters:
   *     - in: query
   *       name: keyword
   *       schema:
   *          type: integer
   *     - in: query
   *       name: cityName
   *       schema:
   *          type: string
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public marketPlaceSuggested = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trimSpace = (text: string) =>
        text
          .split(' ')
          .filter((x: string) => x)
          .join(' ');

      const search = {
        keywords: trimSpace(req.query.keyword ? req.query.keyword.toString() : ''),
        customerId: req.query.customerId,
        cityName: req.query.cityName
      };

      const validateErrorsSearch = validate(search, suggestedSchema);
      if (validateErrorsSearch) {
        return next(new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST));
      }

      const keywords: string = (search.keywords || '') as string;
      let keywordsQuery: string = '';
      if (!keywords) {
        keywordsQuery = '\'%%\'';
      } else {
        keywordsQuery = `unaccent('%${keywords}%')`;
      }

      const cateServices = await this.cateServiceSuggested(keywordsQuery);
      const popularServices = await this.popularServicesSuggested(keywordsQuery);
      const suggestionByKeywords = await this.keywordsSuggested(keywordsQuery);

      const results = {
        suggestionByKeywords,
        cateServices,
        popularServices
      };

      return res.status(HttpStatus.OK).send(buildSuccessMessage(results));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };

  private cateServiceSuggested = async (keywords: string) => {
    try {
      const cateServices = await CateServiceModel.findAll({
        attributes: { exclude: ['createdAt', 'deletedAt', 'updatedAt'] },
        include: [
          {
            model: CompanyModel,
            as: 'company',
            required: true,
            attributes: []
          }
        ],
        where: Sequelize.literal(`unaccent("CateServiceModel"."name") ilike any(array[${keywords}])`)
      });

      return cateServices;
    } catch (error) {
      throw error;
    }
  };

  private popularServicesSuggested = async (keywords: string) => {
    try {
      const popularServices = await sequelize.query(
        [
          'SELECT service.*',
          'FROM service',
          'LEFT JOIN appointment_detail ON appointment_detail.service_id = service.id',
          `WHERE service.status LIKE 'active' and unaccent(service.name) ilike ${keywords}`,
          'GROUP BY service.id, appointment_detail.id',
          'ORDER BY count(appointment_detail.id) desc',
          'LIMIT 10'
        ].join(' '),
        {
          mapToModel: true,
          model: ServiceModel,
          type: QueryTypes.SELECT
        }
      );

      return popularServices;
    } catch (error) {
      throw error;
    }
  };

  private searchRecentSuggested = async (searchOption: any) => {
    try {
      let recentSearch: any = await CustomerSearchModel.findAll({
        where: {
          customerId: searchOption.customerId
        },
        include: [
          {
            model: CateServiceModel,
            as: 'cateService',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: CompanyModel,
            as: 'company',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deteledAt'] },
            include: [
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: true,
                attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] }
              }
            ]
          },
          {
            model: ServiceModel,
            as: 'service',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          },
          {
            model: LocationModel,
            as: 'location',
            required: false,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          }
        ],
        group: [
          'CustomerSearchModel.id',
          'cateService.id',
          'company.id',
          'company->companyDetail.id',
          'service.id',
          'location.id'
        ]
      });
      recentSearch = {
        ...recentSearch.dataValues,
        cateService: recentSearch.cataService?.dataValues,
        company: {
          ...recentSearch.company?.dataValues,
          ...recentSearch.company?.companyDetail?.dataValues,
          companyDetails: undefined
        },
        service: recentSearch.service?.datavalues,
        location: recentSearch.location?.dataValues
      };
      return recentSearch;
    } catch (error) {
      throw error;
    }
  };

  private keywordsSuggested = async (keywords: string) => {
    try {
      const cateServices = await CateServiceModel.findAll({
        where: Sequelize.literal(`unaccent("CateServiceModel"."name") ilike any(array[${keywords}])`),
        attributes: {
          include: [[Sequelize.literal('\'cateService\''), 'type']],
          exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        limit: 3
      });
      const companies = (await CompanyModel.findAll({
        attributes: {
          include: [[Sequelize.literal('\'company\''), 'type']],
          exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        include: [
          {
            model: CompanyDetailModel,
            as: 'companyDetail',
            required: true,
            attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'] }
          }
        ],
        where: Sequelize.literal(`unaccent("companyDetail"."business_name") ilike any(array[${keywords}])`),
      })).map((company: any) => ({
        ...company.dataValues,
        ...company.companyDetail?.dataValues,
        companyDetail: undefined
      }));

      const services = await ServiceModel.findAll({
        where: Sequelize.literal(`unaccent("ServiceModel"."name") ilike any(array[${keywords}])`),
        attributes: {
          include: [[Sequelize.literal('\'service\''), 'type']],
          exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        limit: 3
      });

      const locations = await LocationModel.findAll({
        where: {
          [Op.or]: [
            Sequelize.literal(`unaccent("LocationModel"."name") ilike any(array[${keywords}])`),
            Sequelize.literal(`unaccent("LocationModel"."address") ilike any(array[${keywords}])`)
          ]
        },
        attributes: {
          include: [[Sequelize.literal('\'location\''), 'type']],
          exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        limit: 3
      });
      return {
        cateServices,
        companies,
        services,
        locations
      };
    } catch (error) {
      throw error;
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/suggested-recent:
   *   get:
   *     tags:
   *       - Branch
   *     name: marketPlaceSuggestedRecent
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public marketPlaceSuggestedRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = {
        customerId: req.query.customerId
      };

      const validateErrorsSearch = validate(search, suggestedSchema);
      if (validateErrorsSearch) {
        return next(new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST));
      }

      let customer = null;
      if (search.customerId) {
        customer = await CustomerModel.findOne({ where: { id: search.customerId } });
      }
      let recentSearch = null;
      let recentBooking = null;
      let recentView = null;
      if (customer) {
        recentSearch = await this.searchRecentSuggested(search);
        recentBooking = await this.recentBookingSuggested(search);
        recentView = await this.recentViewSuggested(search);
      }

      const results = {
        recentSearch,
        recentView,
        recentBooking
      };

      return res.status(HttpStatus.OK).send(buildSuccessMessage(results));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };


  private recentBookingSuggested = async (searchOption: any) => {
    try {
      let recentBookings: any = (
        await RecentBookingModel.findAll({
          where: { customerId: searchOption.customerId },
          order: [['createdAt', 'DESC']],
          limit: 4
        })
      ).map((recentBooking: any) => ({
        locationId: recentBooking.locationId,
        staffId: recentBooking.staffId
      }));

      if (!recentBookings) {
        recentBookings = [];
        return recentBookings;
      }
      const recentBookingHistory: any = [];
      for (let i = 0; i < recentBookings.length; i++) {
        let staff: any = await StaffModel.findOne({
          where: { id: recentBookings[i].staffId },
          attributes: ['id', 'firstName', 'avatarPath'],
          include: [
            {
              model: LocationModel,
              as: 'workingLocations',
              through: { attributes: [] },
              where: { id: recentBookings[i].locationId },
              attributes: ['name']
            }
          ]
        });
        staff = staff.dataValues;
        staff = {
          ...staff,
          ...staff.workingLocations[0].dataValues,
          ['workingLocations']: undefined
        };

        recentBookingHistory.push(staff);
      }
      //filter Duplication Element

      // recentBookingHistory.filter((item: any, index: any) => {
      //   return recentBookingHistory.indexOf(item === index);
      // });

      return recentBookingHistory;
    } catch (error) {
      throw error;
    }
  };

  public recentViewSuggested = async (searchOption: any) => {
    try {
      let recentViews = (
        await RecentViewModel.findAll({
          where: {
            customerId: searchOption.customerId
          },
          order: [['createdAt', 'DESC']]
        })
      ).map((recentView: any) => ({
        locationId: recentView.locationId
      }));
      if (!recentViews) {
        recentViews = [];
        return recentViews;
      }

      const locationIds: any = [];
      for (let i = 0; i < recentViews.length; i++) {
        locationIds.push(recentViews[i].locationId);
      }
      const locationViews: any = (
        await LocationModel.findAll({
          where: { id: { [Op.in]: locationIds } },
          include: [
            {
              model: LocationImageModel,
              as: 'locationImages',
              required: true,
              attributes: ['path'],
              limit: 1
            }
          ],
          attributes: ['id', 'name', 'photo', 'address', 'district', 'ward']
        })
      ).map((locationView: any) => ({
        ...locationView.dataValues,
        ...locationView.locationDetail.dataValues,
        ...locationView.locationImages[0]?.dataValues,
        ['locationDetail']: undefined,
        ['locationImages']: undefined
      }));
      return locationViews;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/get-location/{pathName}:
   *   get:
   *     tags:
   *       - Branch
   *     parameters:
   *     - in: path
   *       name: pathName
   *       schema:
   *          type: string
   *       required: true
   *     - in: query
   *       name: customerId
   *       schema:
   *          type: string
   *     name: getLocationMarketPlace
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public getLocationMarketPlace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        pathName: req.params.pathName,
        customerId: req.query.customerId
      };

      const validateErrors = validate(data, getLocationMarketPlace);
      if (validateErrors) {
        return next(new CustomError(validateErrors, HttpStatus.BAD_REQUEST));
      }

      let staffs: any = [];
      let locations: any = [];
      let cateServices: any = [];
      let location: any = await LocationModel.findOne({
        include: [
          {
            model: CompanyModel,
            as: 'company',
            required: true,
            attributes: ['ownerId'],
            include: [
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: true,
                attributes: ['businessType', 'businessName']
              }
            ]
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false,
            attributes: ['path', 'is_avatar']
          }
        ],
        where: { pathName: data.pathName },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
      });

      if (location) {
        locations = (
          await LocationModel.findAll({
            where: { companyId: location.companyId },
            include: [
              {
                model: LocationWorkingHourModel,
                as: 'workingTimes',
                required: true,
                where: { [Op.or]: [{ weekday: 'monday' }, { weekday: 'friday' }] },
                order: [['weekday', 'DESC']],
                attributes: ['weekday', 'startTime', 'endTime']
              }
            ],
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            group: [
              'LocationModel.id',
              'workingTimes.id',
              'workingTimes.start_time',
              'workingTimes.end_time',
              'workingTimes.weekday'
            ]
          })
        ).map((locate: any) => ({
          ...locate.dataValues
        }));

        location = location.dataValues;
        location = {
          ...location,
          ...location.locationImages?.dataValues,
          ...location.company?.dataValues,
          ['company']: undefined,
          ['locationDetail']: undefined
        };

        staffs = await StaffModel.findAll({
          raw: true,
          where: { mainLocationId: location.id },
          attributes: ['id', 'firstName', 'avatarPath'],
          order: Sequelize.literal(
            'case when "avatar_path" IS NULL then 3 when "avatar_path" = \'\' then 2 else 1 end, "avatar_path"'
          )
        });

        const serviceIds: any = (
          await LocationServiceModel.findAll({
            raw: true,
            where: { locationId: location.id },
            attributes: ['service_id']
          })
        ).map((serviceId: any) => serviceId.service_id);

        cateServices = await CateServiceModel.findAll({
          where: { companyId: location.companyId },
          attributes: ['id', 'name'],
          include: [
            {
              model: ServiceModel,
              as: 'services',
              required: true,
              attributes: ['id', 'name', 'duration', 'sale_price'],
              where: { id: serviceIds }
            }
          ],
          group: ['CateServiceModel.id', 'services.id']
        });
      } else {
        location = {};
      }

      let customer = null;
      if (data.customerId) {
        customer = await CustomerModel.findOne({ where: { id: data.customerId } });
      }

      if (customer && location) {
        let recentViews: any = await RecentViewModel.findOne({
          where: { customerId: data.customerId, locationId: location.id }
        });
        if (!recentViews) {
          const recentViewData: any = {
            id: uuidv4(),
            customerId: data.customerId,
            locationId: location.id
          };
          await RecentViewModel.create(recentViewData);
        } else {
          recentViews = recentViews.dataValues;
          recentViews.view += 1;
          await RecentViewModel.update(
            { view: recentViews.view },
            {
              where: {
                id: recentViews.id
              }
            }
          );
        }
      }

      const locationDetails = {
        locations: locations,
        locationInformation: location,
        cateServices: cateServices,
        staffs: staffs
      };

      return res.status(HttpStatus.OK).send(buildSuccessMessage(locationDetails));
    } catch (error) {
      // return next(new CustomError(locationErrorDetails.E_1007(), HttpStatus.INTERNAL_SERVER_ERROR));
      return next(error);
    }
  };
}
