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
  LocationStaffModel,
  CompanyTypeDetailModel
} from '../../../repositories/postgres/models';
import { esClient } from '../../../repositories/elasticsearch';

import {
  searchSchema,
  suggestedSchema,
  getLocationMarketPlace,
  getLocationMarketPlacebyId
} from '../configs/validate-schemas';
import { FindOptions, Op, Sequelize, QueryTypes } from 'sequelize';
import { paginate, paginateElasticSearch } from '../../../utils/paginator';
import { EOrder } from '../../../utils/consts';
import { LocationImageModel } from '../../../repositories/postgres/models/location-image';
import { v4 as uuidv4 } from 'uuid';
import { LocationServiceModel } from '../../../repositories/postgres/models/location-service';
import { removeAccents } from '../../../utils/text';
import { RecentViewModel } from '../../../repositories/postgres/models/recent-view-model';
import { parseDataByType } from '../utils';
import {
  deleteRecentBookingSchema,
  deleteRecentViewSchema,
  deleteRecentSearchSchema
  // suggestCountryAndCity
} from '../configs/validate-schemas/recent-view';
import _ from 'lodash';
import dotenv from 'dotenv';

const { parsed: env } = dotenv.config();

export class SearchController {
  private calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
    const X = {
      lat: _.isNumber(+lat1) ? +lat1 : 0,
      lon: _.isNumber(+lon1) ? +lon1 : 0
    };
    const Y = {
      lon: _.isNumber(+lon2) ? +lon2 : 0,
      lat: _.isNumber(+lat2) ? +lat2 : 0
    };

    const R = 6371; // km
    const toRad = (value: number) => (value * Math.PI) / 180; // Converts numeric degrees to radians
    const dLat = toRad(Y.lat - X.lat);
    const dLon = toRad(Y.lon - X.lon);
    X.lat = toRad(X.lat);
    Y.lat = toRad(Y.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(X.lat) * Math.cos(Y.lat);
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
   *          type: string
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
   *       name: searchBy
   *       schema:
   *          type: string
   *          enum:
   *            - service
   *            - cate-service
   *            - company
   *            - city
   *     - in: query
   *       name: latitude
   *       schema:
   *          type: number
   *     - in: query
   *       name: longitude
   *       schema:
   *          type: number
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
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.query.pageNum,
        pageSize: req.query.pageSize
      };
      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
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
        order: req.query.order,
        searchBy: req.query.searchBy
      };

      const validateErrorsSearch = validate(search, searchSchema);
      if (validateErrorsSearch) {
        throw new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST);
      }
      const keywords: string = (search.keywords || '') as string;
      let keywordsQuery: string = '';
      if (!keywords) {
        keywordsQuery = "'%%'";
      } else {
        keywordsQuery = `unaccent('%${keywords}%')`;
      }

      const queryLocations: any = {
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
                required: false,
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
          isoMarketplace: true,
          [Op.and]: [
            {
              [Op.or]: [
                Sequelize.literal(`unaccent("LocationModel"."address") ilike any(array[${keywordsQuery}])`),
                Sequelize.literal(`unaccent("LocationModel"."name") ilike any(array[${keywordsQuery}])`)
              ]
            }
          ]
        },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        group: [
          'LocationModel.id',
          'marketplaceValues.id',
          'marketplaceValues->marketplaceField.id',
          'locationImages.id',
          'services.id',
          'services->LocationServiceModel.id',
          'company.id',
          'company->cateServices.id',
          'company->companyDetail.id'
        ]
      };

      if (req.query.order === EOrder.NEWEST) {
        queryLocations.order = [['"LocationModel"."openedAt"', 'DESC']];
      }

      const keywordRemoveAccents = removeAccents(keywords).toLowerCase();

      let searchCateServiceItem: any = {};
      let searchCompanyItem: any = {};
      let searchServiceItem: any = {};
      let searchLocationItem: any = {};
      let locationResults = await LocationModel.findAll(queryLocations);
      locationResults = locationResults.map((location: any) => {
        location = location.dataValues;
        if (location.name && removeAccents(location.name).toLowerCase().search(keywordRemoveAccents)) {
          searchLocationItem = location;
        }

        if (location.company) {
          location.company = location.company.dataValues;
          if (
            location.company.businessName &&
            removeAccents(location.company.businessName).toLowerCase().search(keywordRemoveAccents)
          ) {
            searchCompanyItem = location.company;
          }

          if (
            location.services &&
            !_.isEmpty(location.services) &&
            location.services[0].name &&
            removeAccents(location.services[0].name).toLowerCase().search(keywordRemoveAccents)
          ) {
            searchServiceItem = location.services[0];
          }

          if (location.company.cateServices && Array.isArray(location.company.cateServices)) {
            location.company.cateServices.map((cateService: any) => {
              cateService = cateService.dataValues;
              if (removeAccents(cateService.name).toLowerCase().search(keywordRemoveAccents)) {
                searchCateServiceItem = cateService;
              }
              return cateService;
            });
            location.company.cateServices = undefined;
          }
        }
        const locationDetail = location.marketplaceValues.reduce(
          (acc: any, { value, marketplaceField: { name, type } }: any) => ({
            ...acc,
            [name]: parseDataByType[type](value)
          }),
          {}
        );

        location = {
          ...location,
          ...location.locationImages?.dataValues,
          ...locationDetail,
          company: {
            ...location.company?.dataValues,
            ...location.company?.companyDetail?.dataValues,
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
        cityName: req.query.cityName
      };

      const validateErrorsSearch = validate(search, suggestedSchema);
      if (validateErrorsSearch) {
        throw new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST);
      }
      const keywords: string = (search.keywords || '') as string;
      let keywordsQuery: string = '';
      if (!keywords) {
        keywordsQuery = "'%%'";
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
          'GROUP BY service.id',
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

  /**
   * @swagger
   * /branch/location/market-place/suggested-recent:
   *   get:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: marketPlaceSuggestedRecent
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public marketPlaceSuggestedRecent = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      const recentSearch = await this.recentSearchSuggested({ customerId });
      const recentBooking = await this.recentBookingSuggested({ customerId });
      const recentView = await this.recentViewSuggested({ customerId });

      const results = {
        recentSearch,
        recentView,
        recentBooking
      };

      return res.status(HttpStatus.OK).send(buildSuccessMessage(results));
    } catch (error) {
      return next(error);
    }
  };

  private recentSearchSuggested = async (searchOption: any) => {
    try {
      // type:
      //    cateservice
      //    company
      //    service
      //    location
      const recentSearchData: any = await CustomerSearchModel.findAll({
        where: {
          customerId: searchOption.customerId
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        subQuery: true,
        attributes: ['id', 'keywords', 'type', 'cateServiceId', 'companyId', 'serviceId', 'locationId', 'createdAt'],
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
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: false,
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
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [
              {
                model: LocationImageModel,
                as: 'locationImages'
              }
            ]
          }
        ]
      });

      const mapData: any = {
        ['service'](data: any) {
          const { name, description } = data.dataValues;
          return {
            title: name,
            description
          };
        },
        ['cateService'](data: any) {
          const { name } = data.dataValues;
          return {
            title: name
          };
        },
        ['company'](data: any) {
          const { businessName, description } = data.companyDetail?.dataValues;
          return {
            name: businessName,
            description
          };
        },
        ['location'](data: any) {
          const { name, fullAddress, pathName, locationImages } = data.dataValues;
          return {
            title: name,
            description: fullAddress,
            pathName,
            image: locationImages.filter((locationImage: any) => locationImage.is_avatar).length
              ? locationImages.filter((locationImage: any) => locationImage.is_avatar)[0].path
              : locationImages.length
              ? locationImages[0].path
              : ''
          };
        }
      };

      const dataDefault: any = {
        type: '',
        title: '',
        description: '',
        image: '',
        pathName: null
      };

      const hideField: any = {
        cateService: undefined,
        company: undefined,
        service: undefined,
        location: undefined
      };

      const recentSearch: {
        type: string;
        title?: string;
        description?: string;
        image?: string;
        pathName?: string;
      }[] = recentSearchData
        .filter((searchData: any) => !!searchData.type)
        .map((searchData: any) => {
          const { type } = searchData;
          return {
            ...dataDefault,
            ...searchData.dataValues,
            searchId: searchData.dataValues.id,
            ...hideField,
            ...mapData[type](searchData[type])
          };
        });
      return recentSearch;
    } catch (error) {
      throw error;
    }
  };

  private keywordsSuggested = async (keywords: string) => {
    try {
      const dataDefault: any = {
        type: '',
        title: '',
        description: '',
        image: '',
        pathName: null
      };
      const cateServices: any = (
        await CateServiceModel.findAll({
          where: Sequelize.literal(`unaccent("CateServiceModel"."name") ilike any(array[${keywords}])`),
          attributes: {
            include: [[Sequelize.literal("'cateService'"), 'type']],
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
          },
          limit: 3
        })
      ).map(({ id, type, name }: any) => ({
        ...dataDefault,
        id,
        type,
        title: name
      }));

      const companies: any = (
        await CompanyModel.findAll({
          attributes: {
            include: [[Sequelize.literal("'company'"), 'type']],
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
          where: Sequelize.literal(`unaccent("companyDetail"."business_name") ilike any(array[${keywords}])`)
        })
      ).map(({ id, type, companyDetail: { businessName, description } }: any) => ({
        ...dataDefault,
        id,
        type,
        title: businessName,
        description
      }));

      const services: any = (
        await ServiceModel.findAll({
          where: Sequelize.literal(`unaccent("ServiceModel"."name") ilike any(array[${keywords}])`),
          attributes: {
            include: [[Sequelize.literal("'service'"), 'type']],
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
          },
          limit: 3
        })
      ).map(({ id, type, name, description }: any) => ({
        ...dataDefault,
        id,
        type,
        title: name,
        description
      }));

      const locations: any = (
        await LocationModel.findAll({
          where: {
            [Op.or]: [
              Sequelize.literal(`unaccent("LocationModel"."name") ilike any(array[${keywords}])`),
              Sequelize.literal(`unaccent("LocationModel"."address") ilike any(array[${keywords}])`)
            ]
          },
          attributes: {
            include: [[Sequelize.literal("'location'"), 'type']],
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
          },
          limit: 3,
          include: [
            {
              model: LocationImageModel,
              as: 'locationImages'
            }
          ]
        })
      ).map(({ id, type, name, description, pathName, locationImages }: any) => ({
        ...dataDefault,
        id,
        type,
        title: name,
        pathName,
        description,
        image: locationImages.filter((locationImage: any) => locationImage.is_avatar).length
          ? locationImages.filter((locationImage: any) => locationImage.is_avatar)[0].path
          : locationImages.length
          ? locationImages[0].path
          : ''
      }));
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

  private recentBookingSuggested = async (searchOption: any) => {
    try {
      let recentBookings: any = (
        await RecentBookingModel.findAll({
          where: { customerId: searchOption.customerId },
          order: [['createdAt', 'DESC']],
          limit: 4
        })
      ).map((recentBooking: any) => ({
        id: recentBooking.id,
        locationId: recentBooking.locationId,
        staffId: recentBooking.staffId
      }));

      if (!recentBookings) {
        recentBookings = [];
        return recentBookings;
      }
      const newStaff: any = [];
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
              attributes: ['name', 'path_name', 'full_address']
            }
          ]
        });
        staff = staff.dataValues;
        staff = {
          ...staff,
          ...(staff.workingLocations && staff.workingLocations.length ? staff.workingLocations[0].dataValues : {}),
          bookingId: recentBookings[i].id,
          ['workingLocations']: undefined
        };
        newStaff.push(staff);
      }
      const recentBookingHistory = newStaff.map(
        ({
          id: id,
          firstName: staffName,
          avatarPath: avatarPath,
          workingLocations: workingLocations,
          name: locationName,
          path_name: locationPath,
          full_address: fullAddress,
          bookingId
        }: any) => ({
          id,
          staffName,
          avatarPath,
          workingLocations,
          locationName,
          locationPath,
          fullAddress,
          bookingId
        })
      );
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
        id: recentView.id,
        locationId: recentView.locationId
      }));
      if (!recentViews) {
        recentViews = [];
        return recentViews;
      }
      let locationViews: any = [];
      for (let i = 0; i < recentViews.length; i++) {
        const rawLocationView = await LocationModel.findOne({
          where: { id: recentViews[i].locationId },
          include: [
            {
              model: LocationImageModel,
              as: 'locationImages',
              required: true,
              attributes: ['path'],
              limit: 1
            }
          ],
          attributes: ['id', 'name', 'address', 'district', 'ward', 'path_name', 'full_address']
        }).then((locationView: any) => ({
          ...locationView.dataValues,
          ...(locationView.locationImages && locationView.locationImages.length
            ? locationView.locationImages[0].dataValues
            : {}),
          viewId: recentViews[i].id,
          ['locationImages']: undefined
        }));
        locationViews.push(rawLocationView);
      }
      locationViews = locationViews.map(
        ({
          id: id,
          name: locationName,
          address: address,
          district: district,
          ward: ward,
          path: locationImage,
          path_name: locationPath,
          full_address: fullAddress,
          viewId: viewId
        }: any) => ({
          id,
          locationName,
          address,
          district,
          ward,
          locationImage,
          locationPath,
          fullAddress,
          viewId
        })
      );
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
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      let staffs: any = [];
      let locations: any = [];
      let cateServices: any = [];
      let nearLocation: any = [];
      let location: any = await LocationModel.findOne({
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
            model: CompanyModel,
            as: 'company',
            required: true,
            attributes: ['ownerId'],
            include: [
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: false,
                attributes: { exclude: ['createdAt', 'updateAt', 'deletedAt'] }
              },
              {
                model: CompanyTypeDetailModel,
                as: 'companyTypeDetails',
                through: { attributes: [] },
                required: false,
                attributes: { exclude: ['createdAt', 'updateAt', 'deletedAt'] }
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
            model: LocationWorkingHourModel,
            as: 'workingTimes',
            required: true,
            attributes: ['weekday', 'startTime', 'endTime']
          }
        ],
        order: [
          [{ model: LocationImageModel, as: 'locationImages' }, 'is_avatar', 'DESC'],
          Sequelize.literal(`
            CASE
               WHEN "workingTimes".weekday = 'sunday' THEN 8
               WHEN "workingTimes".weekday = 'monday' THEN 2
               WHEN "workingTimes".weekday = 'tuesday' THEN 3
               WHEN "workingTimes".weekday = 'wednesday' THEN 4
               WHEN "workingTimes".weekday = 'thursday' THEN 5
               WHEN "workingTimes".weekday = 'friday' THEN 6
               WHEN "workingTimes".weekday = 'saturday' THEN 7
            END ASC
          `)
        ],
        where: { pathName: data.pathName },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        subQuery: false,
        limit: 1000000
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
                attributes: ['weekday', 'startTime', 'endTime']
              },
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
                model: CompanyModel,
                as: 'company',
                required: true,
                attributes: ['ownerId'],
                include: [
                  {
                    model: CompanyDetailModel,
                    as: 'companyDetail',
                    required: false,
                    attributes: { exclude: ['createdAt', 'updateAt', 'deletedAt'] }
                  },
                  {
                    model: CompanyTypeDetailModel,
                    as: 'companyTypeDetails',
                    through: { attributes: [] },
                    required: false,
                    attributes: { exclude: ['createdAt', 'updateAt', 'deletedAt'] }
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
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            order: Sequelize.literal(`
              CASE
                 WHEN "workingTimes".weekday = 'sunday' THEN 8
                 WHEN "workingTimes".weekday = 'monday' THEN 2
                 WHEN "workingTimes".weekday = 'tuesday' THEN 3
                 WHEN "workingTimes".weekday = 'wednesday' THEN 4
                 WHEN "workingTimes".weekday = 'thursday' THEN 5
                 WHEN "workingTimes".weekday = 'friday' THEN 6
                 WHEN "workingTimes".weekday = 'saturday' THEN 7
              END ASC
            `)
          })
        ).map((loc: any) => {
          loc = JSON.parse(JSON.stringify(loc));
          const locationDetailField = loc.marketplaceValues.reduce(
            (acc: any, { value, marketplaceField: { name, type } }: any) => ({
              ...acc,
              [name]: parseDataByType[type](value)
            }),
            {}
          );

          return {
            ...loc,
            ...locationDetailField,
            ...loc.company,
            ['marketplaceValues']: undefined,
            distance: this.calcCrow(location.latitude, location.longitude, loc.latitude, loc.longitude)
          };
        });

        const locationDetail = location.marketplaceValues.reduce(
          (acc: any, { value, marketplaceField: { name, type } }: any) => ({
            ...acc,
            [name]: parseDataByType[type](value)
          }),
          {}
        );

        location = JSON.parse(JSON.stringify(location.dataValues));
        location = {
          ...location,
          ...locationDetail,
          ...location.company,
          ['marketplaceValues']: undefined,
          ['company']: undefined
        };

        const staffIds: any = (
          await LocationStaffModel.findAll({
            raw: true,
            where: { locationId: location.id },
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          })
        ).map((staffIdElement: any) => staffIdElement.staffId);

        staffs = await StaffModel.findAll({
          raw: true,
          attributes: ['id', 'firstName', 'avatarPath'],
          order: Sequelize.literal(
            'case when "avatar_path" IS NULL then 3 when "avatar_path" = \'\' then 2 else 1 end, "avatar_path"'
          ),
          where: { id: staffIds }
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
              attributes: ['id', 'name', 'duration', 'salePrice'],
              where: { id: serviceIds }
            }
          ],
          group: ['CateServiceModel.id', 'services.id']
        });
        const searchNearLocationOptions = {
          index: env!.ELS_INDEX_MARKETPLACE_SEARCH,
          body: {
            query: {
              bool: {
                must_not: [
                  {
                    match: {
                      id: location.id
                    }
                  }
                ],
                must: {
                  bool: {
                    should: [
                      {
                        query_string: {
                          fields: ['country'],
                          query: `${location.country}~1`
                        }
                      },
                      {
                        query_string: {
                          fields: ['countryCode'],
                          query: `${location.countryCode}~1`
                        }
                      }
                    ]
                  }
                }
              }
            },
            sort: [
              {
                _geo_distance: {
                  location: {
                    lat: location.latitude,
                    lon: location.longitude
                  },
                  order: 'asc',
                  unit: 'km',
                  distance_type: 'arc',
                  ignore_unmapped: true
                }
              }
            ],
            from: 0,
            size: 10
          }
        };
        nearLocation = await esClient
          .search(searchNearLocationOptions)
          .then(
            (result: any) =>
              result.body.hits?.hits.map((item: any) => ({ ...item._source, distance: item.sort[0] })) || []
          );
        nearLocation = nearLocation.map((loc: any) => {
          const locationDetailField = loc.marketplaceValues
            .filter((item: any) => item.id)
            .reduce(
              (acc: any, { value, marketplaceField: { name, type } }: any) => ({
                ...acc,
                [name]: parseDataByType[type](value)
              }),
              {}
            );

          return {
            ...loc,
            ...locationDetailField,
            ...loc.company,
            ['marketplaceValues']: undefined,
            ['company']: undefined,
            ['@timestamp']: undefined,
            ['@version']: undefined
          };
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
      const wellaholicPath = [
        '2-Venture-Drive',
        '1-Irving-Place',
        '208-Hougang-Street-21',
        '545-Orchard-Road',
        '210A-Telok-Ayer-Street'
      ];
      if (wellaholicPath.includes(data.pathName)) {
        const nearbyWellaholicId = [
          'ca4cc69c-edf8-4bde-ad97-ae60b9a16b62',
          '3c8bd088-491e-4fd2-9e00-2764480a8ab0',
          'a1310b55-e172-4c1d-964f-593e677ad4b8',
          'c752736e-d6f6-4cf1-bb7c-6b73edca8eaa'
        ];
        const nearbyLocation = await LocationModel.findAll({
          where: {
            id: {
              [Op.in]: nearbyWellaholicId
            }
          },
          include: [
            {
              model: LocationImageModel,
              as: 'locationImages',
              required: false,
              attributes: ['path', 'is_avatar']
            }
          ],
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        });
        const locationDetails = {
          locations: locations,
          locationInformation: location,
          cateServices: cateServices,
          staffs: staffs,
          nearLocation: nearbyLocation
        };
        return res.status(HttpStatus.OK).send(buildSuccessMessage(locationDetails));
      } else {
        const locationDetails = {
          locations: locations,
          locationInformation: location,
          cateServices: cateServices,
          staffs: staffs,
          nearLocation: nearLocation
        };
        return res.status(HttpStatus.OK).send(buildSuccessMessage(locationDetails));
      }
    } catch (error) {
      // throw new CustomError(locationErrorDetails.E_1007(), HttpStatus.INTERNAL_SERVER_ERROR);
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/get-location-by-id/{locationId}:
   *   get:
   *     tags:
   *       - Branch
   *     parameters:
   *     - in: path
   *       name: locationId
   *       schema:
   *          type: string
   *       required: true
   *     - in: query
   *       name: customerId
   *       schema:
   *          type: string
   *     name: getLocationMarketPlaceById
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public getLocationMarketPlaceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        locationId: req.params.locationId,
        customerId: req.query.customerId
      };

      const validateErrors = validate(data, getLocationMarketPlacebyId);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      let staffs: any = [];
      let locations: any = [];
      let cateServices: any = [];
      let location: any = await LocationModel.findOne({
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
            model: CompanyModel,
            as: 'company',
            required: true,
            attributes: ['ownerId'],
            include: [
              {
                model: CompanyDetailModel,
                as: 'companyDetail',
                required: false,
                attributes: { exclude: ['id', 'createdAt', 'updateAt', 'deletedAt'] }
              },
              {
                model: CompanyTypeDetailModel,
                as: 'companyTypeDetails',
                through: { attributes: [] },
                required: false,
                attributes: { exclude: ['createdAt', 'updateAt', 'deletedAt'] }
              }
            ]
          },
          {
            model: LocationImageModel,
            as: 'locationImages',
            required: false,
            separate: true,
            order: ['is_avatar', 'DESC'],
            attributes: ['path', 'is_avatar']
          }
        ],
        where: { id: data.locationId },
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

        const locationDetail = location.marketplaceValues.reduce(
          (acc: any, { value, marketplaceField: { name, type } }: any) => ({
            ...acc,
            [name]: parseDataByType[type](value)
          }),
          {}
        );

        location = location.dataValues;
        location = {
          ...location,
          ...locationDetail,
          ...location.locationImages?.dataValues,
          ...location.company?.dataValues,
          ['marketplaceValues']: undefined,
          ['company']: undefined
        };

        const staffIds: any = (
          await LocationStaffModel.findAll({
            raw: true,
            where: { locationId: location.id },
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
          })
        ).map((staffIdElement: any) => staffIdElement.staffId);

        staffs = await StaffModel.findAll({
          raw: true,
          where: { id: staffIds },
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
              attributes: ['id', 'name', 'duration', 'salePrice'],
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
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/delete-recent-search/{recentSearchId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     parameters:
   *     - in: path
   *       name: recentSearchId
   *       schema:
   *          type: string
   *       required: true
   *     name: deleteRecentSearch
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public deleteRecentSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = {
        customerId: res.locals.customerPayload.id,
        recentSearchId: req.params.recentSearchId
      };
      const validateErrors = validate(dataInput, deleteRecentSearchSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      await CustomerSearchModel.destroy({
        where: {
          customerId: dataInput.customerId,
          id: dataInput.recentSearchId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/recent-search/delete-all:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     parameters:
   *     - in: path
   *       name: recentSearchId
   *       schema:
   *          type: string
   *       required: true
   *     name: deleteAllRecentSearch
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public deleteAllRecentSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      await CustomerSearchModel.destroy({
        where: {
          customerId: customerId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/delete-recent-view/{recentViewId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     parameters:
   *     - in: path
   *       name: recentViewId
   *       schema:
   *          type: string
   *       required: true
   *     name: deleteRecentView
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public deleteRecentView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = {
        customerId: res.locals.customerPayload.id,
        recentViewId: req.params.recentViewId
      };
      const validateErrors = validate(dataInput, deleteRecentViewSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      await RecentViewModel.destroy({
        where: {
          customerId: dataInput.customerId,
          id: dataInput.recentViewId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/recent-view/delete-all:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteAllRecentView
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */
  public deleteAllRecentView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      await RecentViewModel.destroy({
        where: {
          customerId: customerId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/delete-recent-booking/{recentBookingId}:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     parameters:
   *     - in: path
   *       name: recentBookingId
   *       schema:
   *          type: string
   *       required: true
   *     name: deleteRecentBooking
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public deleteRecentBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataInput = {
        customerId: res.locals.customerPayload.id,
        recentBookingId: req.params.recentBookingId
      };
      const validateErrors = validate(dataInput, deleteRecentBookingSchema);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }
      await RecentBookingModel.destroy({
        where: {
          customerId: dataInput.customerId,
          id: dataInput.recentBookingId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/recent-booking/delete-all:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteAllRecentBooking
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public deleteAllRecentBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.customerPayload.id;
      await RecentBookingModel.destroy({
        where: {
          customerId: customerId
        }
      });
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /branch/location/market-place/recent/delete-all:
   *   delete:
   *     tags:
   *       - Branch
   *     security:
   *       - Bearer: []
   *     name: deleteAllRecent
   *     responses:
   *       200:
   *         description: success
   *       500:
   *         description: Server internal errors
   */

  public deleteAllRecent = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: any = null;
    try {
      transaction = await sequelize.transaction();
      const customerId = res.locals.customerPayload.id;
      await RecentBookingModel.destroy({
        where: {
          customerId: customerId
        },
        transaction
      });
      await RecentViewModel.destroy({
        where: {
          customerId: customerId
        },
        transaction
      });
      await CustomerSearchModel.destroy({
        where: {
          customerId: customerId
        },
        transaction
      });
      await transaction.commit();
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return next(error);
    }
  };

  /**
   * @swagger
   * definitions:
   *   search:
   *       required:
   *           pageNum
   *           pageSize
   *       properties:
   *           keyword:
   *               type: string
   *           pageNum:
   *               type: integer
   *           pageSize:
   *               type: integer
   *           searchBy:
   *               type: string
   *               enum: [ 'service', 'cate-service', 'company',  'city' ]
   *           fullAddress:
   *               type: string
   *           latitude:
   *               type: number
   *           longitude:
   *               type: number
   *           customerId:
   *               type: string
   *           addressInfor:
   *               type: array
   *               items:
   *                    type: object
   *           order:
   *               type: string
   *               enum: [ 'nearest', 'newest', 'price_lowest', 'price_highest' ]
   */

  /**
   * @swagger
   * /branch/location/market-place/search-new:
   *   post:
   *     tags:
   *       - Branch
   *     name: searchNew
   *     parameters:
   *     - in: "body"
   *       name: "body"
   *       required: true
   *       schema:
   *         $ref: '#/definitions/search'
   *     responses:
   *       200:
   *         description: success
   *       400:
   *         description: Bad requests - input invalid format, header is invalid
   *       500:
   *         description: Internal server errors
   */

  public searchNew = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fullPath = req.headers['x-base-url'] + req.originalUrl;
      const paginateOptions = {
        pageNum: req.body.pageNum,
        pageSize: req.body.pageSize
      };

      const validateErrors = validate(paginateOptions, baseValidateSchemas.paginateOption);
      if (validateErrors) {
        throw new CustomError(validateErrors, HttpStatus.BAD_REQUEST);
      }

      const trimSpace = (text: string) => text.replace(/\s\s+/g, ' ').trim();
      const search: any = {
        keywords: trimSpace(req.body.keyword ? req.body.keyword.toString() : ''),
        customerId: req.body.customerId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        order: req.body.order,
        searchBy: req.body.searchBy,
        addressInfor: req.body.addressInfor
      };
      const validateErrorsSearch = validate(search, searchSchema);
      if (validateErrorsSearch) {
        throw new CustomError(validateErrorsSearch, HttpStatus.BAD_REQUEST);
      }

      const keywords: string = search.keywords;

      if (search.addressInfor) {
        const isTypesInclude = (info: any) => (...types: string[]) =>
          !!types && types.reduce((isInclude: any, type: string) => !!isInclude || info.types.includes(type), false);
        search.addressInfor.forEach((info: any) => {
          if (info.types && info.types.length > 0) {
            info.long_name = removeAccents(info.long_name);
            if (isTypesInclude(info)('route')) {
              search.street = info.long_name;
              search.streetCode = info.short_name;
            } else if (isTypesInclude(info)('administrative_area_level_2')) {
              search.district = info.long_name;
              search.districtCode = info.short_name;
            } else if (isTypesInclude(info)('administrative_area_level_1')) {
              search.province = info.long_name;
              search.provinceCode = info.short_name;
            } else if (isTypesInclude(info)('country')) {
              search.country = info.long_name;
              search.countryCode = info.short_name;
            } else if (isTypesInclude(info)('locality')) {
              search.city = info.long_name;
              search.cityCode = info.short_name;
            } else if (isTypesInclude(info)('sublocality', 'sublocality_level_1')) {
              search.ward = info.long_name;
              search.wardCode = info.short_name;
            }
          }
        });
      }

      const searchParams: any = {
        index: env!.ELS_INDEX_MARKETPLACE_SEARCH,
        body: {
          query: {
            bool: {
              must: [
                !keywords
                  ? {
                      match_all: {}
                    }
                  : {
                      query_string: {
                        fields: [
                          'name',
                          'company.companyDetail.businessName',
                          'company.cateServices.name',
                          'services.name'
                        ],
                        query: `${keywords}~1`
                      }
                    }
              ]
            }
          }
        }
      };

      if (search.addressInfor) {
        const locationTypes = ['country', 'province', 'city', 'district', 'ward', 'street'];
        searchParams.body.query.bool.should = [];
        locationTypes.forEach((type: string) => {
          if (search[type]) {
            searchParams.body.query.bool.should.push({
              query_string: {
                fields: [type],
                query: `${search[type]}~1`
              }
            });
            searchParams.body.query.bool.should.push({
              query_string: {
                fields: [type + 'Code'],
                query: `${search[type + 'Code']}~1`
              }
            });
          }
        });
        if (search.country) {
          searchParams.body.query.bool.must.push({
            bool: {
              should: [
                {
                  query_string: {
                    fields: ['country'],
                    query: `${search.country}~1`
                  }
                },
                {
                  query_string: {
                    fields: ['countryCode'],
                    query: `${search.countryCode}~1`
                  }
                }
              ]
            }
          });
        }
      }

      if (search.latitude && search.longitude) {
        searchParams.body = {
          ...searchParams.body,
          stored_fields: ['_source'],
          script_fields: {
            distance: {
              script: {
                inline: "doc['location'].arcDistance(params.lat,params.lon) * 0.001",
                params: {
                  lat: search.latitude,
                  lon: search.longitude
                }
              }
            }
          }
        };
      }

      const result: any = await paginateElasticSearch(esClient, searchParams, paginateOptions, fullPath);

      let locationResults = result.data;
      const keywordRemoveAccents = removeAccents(keywords).toLowerCase();
      let searchCateServiceItem: any = null;
      let searchCompanyItem: any = null;
      let searchServiceItem: any = null;
      let searchLocationItem: any = null;
      locationResults = locationResults.map((location: any) => {
        if (
          !searchLocationItem &&
          location.name &&
          removeAccents(location.name).toLowerCase().includes(keywordRemoveAccents)
        ) {
          searchLocationItem = location;
        }

        if (location.company) {
          if (
            !searchCompanyItem &&
            location.company.businessName &&
            removeAccents(location.company.businessName).toLowerCase().includes(keywordRemoveAccents)
          ) {
            searchCompanyItem = location.company;
          }

          if (!searchServiceItem && location.services && !_.isEmpty(location.services)) {
            searchServiceItem =
              location.services.find((service: any) =>
                removeAccents(service.name || '')
                  .toLowerCase()
                  .includes(keywordRemoveAccents)
              ) || null;
          }

          if (!searchCateServiceItem && location.company.cateServices && Array.isArray(location.company.cateServices)) {
            searchCateServiceItem =
              location.company.cateServices.find((cateService: any) =>
                removeAccents(cateService.name || '')
                  .toLowerCase()
                  .includes(keywordRemoveAccents)
              ) || null;
          }
        }
        const locationDetail = location.marketplaceValues
          .filter((item: any) => item.id)
          .reduce(
            (acc: any, { value, marketplaceField: { name, type } }: any) => ({
              ...acc,
              [name]: parseDataByType[type](value)
            }),
            {}
          );
        location = {
          ...location,
          ...locationDetail,
          company: {
            ...location.company,
            ...location.company.companyDetail,
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
        if (searchCateServiceItem) {
          cateServiceId = searchCateServiceItem.id;
          typeResult = 'cateService';
        } else if (searchCompanyItem) {
          companyId = searchCompanyItem.id;
          typeResult = 'company';
        } else if (searchServiceItem) {
          serviceId = searchServiceItem.id;
          typeResult = 'service';
        } else if (searchLocationItem) {
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
      result.data = locationResults;

      return res.status(HttpStatus.OK).send(buildSuccessMessage(result));
    } catch (error) {
      return next(error);
    }
  };
}
