import sequelize from '../configs/db-connector';
import { StaffModel } from './staff-model';
import { CompanyModel } from './company-model';
import { CustomerModel } from './customer-model';
import { LocationModel } from './location';
import { LocationStaffModel } from './staff-location-model';
import { ServiceModel } from './service';
import { ServiceStaffModel } from './service-staff';
import { ResourceModel } from './resource';
import { ServiceResourceModel } from './service-resource';
import { AppointmentModel } from './appointment-model';
import { AppointmentDetailModel } from './appointment-detail-model';
import { AppointmentDetailStaffModel } from './appointment-detail-staff-model';
import { CateServiceModel } from './cate-service';
import { ServiceImageModel } from './service-image';
import { LocationServiceModel } from './location-service';
import { AppointmentGroupModel } from './appointment-group-model';
import { LocationWorkingHourModel } from './location-working-hour-model';
import { CompanyDetailModel } from './company-detail-model';
import { LocationImageModel } from './location-image';
import { CountryModel } from './country-model';
import { CityModel } from './city-model';
import { CustomerSearchModel } from './customer-search-model';
import { PipelineModel } from './pipeline-model';
import { PipelineStageModel } from './pipeline-stage-model';
import { DealModel } from './deal-model';
import { CustomerWisereModel } from './customer-wisere-model';
import { RecentBookingModel } from './recent-booking-model';
import { MarketPlaceFieldsModel } from './marketplace-fields-model';
import { MarketPlaceValueModel } from './marketplace-value-model';
import { ContactModel } from './contact-model';

StaffModel.hasOne(CompanyModel, { foreignKey: 'ownerId', as: 'hasCompany' });
CompanyModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

CompanyModel.hasOne(CompanyDetailModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'companyDetail' });
CompanyDetailModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'companyDetail' });

CompanyModel.hasMany(LocationModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'locations' });
LocationModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

CompanyModel.hasMany(CateServiceModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'cateServices' });
CateServiceModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

StaffModel.belongsToMany(LocationModel, { through: LocationStaffModel, as: 'workingLocations', foreignKey: 'staffId' });
LocationModel.belongsToMany(StaffModel, { through: LocationStaffModel, as: 'staffs', foreignKey: 'locationId' });

// LocationModel.hasMany(StaffModel, { foreignKey: 'mainLocationId', sourceKey: 'id', as: 'staffs' });
// StaffModel.belongsTo(StaffModel, { foreignKey: 'mainLocationId', as: 'location' });

ServiceModel.belongsToMany(StaffModel, { through: ServiceStaffModel, as: 'staffs', foreignKey: 'serviceId' });
StaffModel.belongsToMany(ServiceModel, { through: ServiceStaffModel, as: 'services', foreignKey: 'staffId' });

ResourceModel.belongsToMany(ServiceModel, { through: ServiceResourceModel, as: 'services', foreignKey: 'resourceId' });
ServiceModel.belongsToMany(ResourceModel, { through: ServiceResourceModel, as: 'resources', foreignKey: 'serviceId' });

LocationModel.belongsToMany(ServiceModel, { through: LocationServiceModel, as: 'services', foreignKey: 'locationId' });
ServiceModel.belongsToMany(LocationModel, { through: LocationServiceModel, as: 'locations', foreignKey: 'serviceId' });

LocationModel.hasMany(ResourceModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'resources' });
ResourceModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CateServiceModel.hasMany(ServiceModel, { foreignKey: 'cateServiceId', sourceKey: 'id', as: 'services' });
ServiceModel.belongsTo(CateServiceModel, { foreignKey: 'cateServiceId', as: 'cateService' });

ServiceModel.hasMany(ServiceImageModel, { foreignKey: 'serviceId', sourceKey: 'id', as: 'images' });
ServiceResourceModel.belongsTo(ServiceModel, { foreignKey: 'serviceId', as: 'service' });

// Appointment
AppointmentModel.hasMany(AppointmentDetailModel, {
  foreignKey: 'appointmentId',
  sourceKey: 'id',
  as: 'appointmentDetails'
});
AppointmentDetailModel.belongsTo(AppointmentModel, { foreignKey: 'appointmentId', as: 'appointment' });
ServiceModel.hasMany(AppointmentDetailModel, {
  foreignKey: 'serviceId',
  sourceKey: 'id',
  as: 'appointmentDetails'
});
AppointmentDetailModel.belongsTo(ServiceModel, { foreignKey: 'serviceId', as: 'service' });

ResourceModel.hasMany(AppointmentDetailModel, {
  foreignKey: 'resourceId',
  sourceKey: 'id',
  as: 'appointmentDetails'
});
AppointmentDetailModel.belongsTo(ResourceModel, { foreignKey: 'resourceId', as: 'resource' });

StaffModel.belongsToMany(AppointmentDetailModel, {
  through: AppointmentDetailStaffModel,
  as: 'appointmentDetails',
  foreignKey: 'staffId'
});

AppointmentDetailModel.belongsToMany(StaffModel, {
  through: AppointmentDetailStaffModel,
  as: 'staffs',
  foreignKey: 'appointmentDetailId'
});

LocationModel.hasMany(AppointmentModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'appointments' });
AppointmentModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CustomerModel.hasMany(AppointmentModel, { foreignKey: 'customerId', sourceKey: 'id', as: 'appointments' });
AppointmentModel.belongsTo(CustomerModel, { foreignKey: 'customerId', as: 'customer' });

AppointmentGroupModel.hasMany(AppointmentModel, {
  foreignKey: 'appointmentGroupId',
  sourceKey: 'id',
  as: 'appointments'
});
AppointmentModel.belongsTo(AppointmentGroupModel, { foreignKey: 'appointmentGroupId', as: 'appointmentGroup' });

LocationModel.hasMany(AppointmentGroupModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'appointmentGroups' });
AppointmentGroupModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

LocationModel.hasMany(LocationWorkingHourModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'workingTimes' });
LocationWorkingHourModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CompanyModel.hasMany(CustomerWisereModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'customerWiseres' });
CustomerWisereModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

CustomerWisereModel.hasMany(AppointmentModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'appointments' });
AppointmentModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

LocationModel.hasMany(LocationImageModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'locationImages' });
LocationImageModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CountryModel.hasMany(CityModel, { foreignKey: 'countryId', sourceKey: 'id', as: 'cities' });
CityModel.belongsTo(CountryModel, { foreignKey: 'countryId', as: 'country' });

CityModel.hasMany(LocationModel, { foreignKey: 'cityId', sourceKey: 'id', as: 'locations' });
LocationModel.belongsTo(CityModel, { foreignKey: 'cityId', as: 'cityy' });

CustomerModel.hasMany(CustomerSearchModel, { foreignKey: 'customerId', sourceKey: 'id', as: 'customerSearches' });
CustomerSearchModel.belongsTo(CustomerModel, { foreignKey: 'customerId', as: 'customer' });

ServiceModel.hasMany(CustomerSearchModel, { foreignKey: 'serviceId', sourceKey: 'id', as: 'customerSearches' });
CustomerSearchModel.belongsTo(ServiceModel, { foreignKey: 'serviceId', as: 'service' });

CateServiceModel.hasMany(CustomerSearchModel, { foreignKey: 'cateServiceId', sourceKey: 'id', as: 'customerSearches' });
CustomerSearchModel.belongsTo(CateServiceModel, { foreignKey: 'cateServiceId', as: 'cateService' });

CompanyModel.hasMany(CustomerSearchModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'customerSearches' });
CustomerSearchModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

LocationModel.hasMany(CustomerSearchModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'customerSearches' });
CustomerSearchModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

AppointmentModel.hasOne(RecentBookingModel, { foreignKey: 'appointmentId', sourceKey: 'id', as: 'appointment' });
RecentBookingModel.belongsTo(AppointmentModel, { foreignKey: 'appointmentId', as: 'recentBooking' });

PipelineModel.hasMany(PipelineStageModel, { foreignKey: 'pipelineId', sourceKey: 'id', as: 'pipelineStages' });
PipelineStageModel.belongsTo(PipelineModel, { foreignKey: 'pipelineId', as: 'pipeline' });

CompanyModel.hasMany(PipelineModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'pipelines' });
PipelineModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

StaffModel.hasMany(DealModel, { foreignKey: 'createdBy', sourceKey: 'id', as: 'deals' });
DealModel.belongsTo(StaffModel, { foreignKey: 'createdBy', as: 'staff' });

StaffModel.hasMany(DealModel, { foreignKey: 'ownerId', sourceKey: 'id', as: 'listDeal' });
DealModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

CustomerWisereModel.hasMany(DealModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'deals' });
DealModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

PipelineStageModel.hasMany(DealModel, { foreignKey: 'pipelineStageId', sourceKey: 'id', as: 'deals' });
DealModel.belongsTo(PipelineStageModel, { foreignKey: 'pipelineStageId', as: 'pipelineStage' });

MarketPlaceFieldsModel.hasMany(MarketPlaceValueModel, { foreignKey: 'fieldId', sourceKey: 'id', as: 'marketplaceValues'});
MarketPlaceValueModel.belongsTo(MarketPlaceFieldsModel, { foreignKey: 'fieldId', as: 'marketplaceField' });

LocationModel.hasMany(MarketPlaceValueModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'marketplaceValues' });
MarketPlaceValueModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CustomerWisereModel.hasMany(ContactModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'contacts' });
ContactModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

export {
  sequelize,
  StaffModel,
  CompanyModel,
  CompanyDetailModel,
  CountryModel,
  CityModel,
  CustomerModel,
  LocationModel,
  ServiceModel,
  ResourceModel,
  CateServiceModel,
  LocationStaffModel,
  AppointmentModel,
  AppointmentDetailModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  LocationWorkingHourModel,
  LocationImageModel,
  CustomerSearchModel,
  RecentBookingModel,
  PipelineModel,
  PipelineStageModel,
  DealModel,
  CustomerWisereModel,
  ContactModel,
  MarketPlaceValueModel,
  MarketPlaceFieldsModel
};
