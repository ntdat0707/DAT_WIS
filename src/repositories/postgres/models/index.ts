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
import { CustomerSearchModel } from './customer-search-model';
import { PipelineModel } from './pipeline-model';
import { PipelineStageModel } from './pipeline-stage-model';
import { DealModel } from './deal-model';
import { CustomerWisereModel } from './customer-wisere-model';
import { RecentBookingModel } from './recent-booking-model';
import { MarketPlaceFieldsModel } from './marketplace-fields-model';
import { MarketPlaceValueModel } from './marketplace-value-model';
import { ContactModel } from './contact-model';
import { FavoriteModel } from './favorite-model';
import { PositionModel } from './position-model';
import { InvoiceModel } from './invoice-model';
import { InvoiceDetailModel } from './invoice-detail-model';
import { InvoiceDetailStaffModel } from './invoice-detail-staff-model';
import { PaymentModel } from './payment-model';
import { ReceiptModel } from './receipt-model';
import { DiscountModel } from './discount-model';
import { PaymentMethodModel } from './payment-method-model';
import { ProviderModel } from './provider-model';
import { TipsModel } from './tips-model';
import { TeamStaffModel } from './team-staff-model';

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

MarketPlaceFieldsModel.hasMany(MarketPlaceValueModel, {
  foreignKey: 'fieldId',
  sourceKey: 'id',
  as: 'marketplaceValues'
});
MarketPlaceValueModel.belongsTo(MarketPlaceFieldsModel, { foreignKey: 'fieldId', as: 'marketplaceField' });

LocationModel.hasMany(MarketPlaceValueModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'marketplaceValues' });
MarketPlaceValueModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

CustomerWisereModel.hasMany(ContactModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'contacts' });
ContactModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

CustomerModel.belongsToMany(LocationModel, {
  through: FavoriteModel,
  as: 'favoriteCustomers',
  foreignKey: 'customerId'
});
LocationModel.belongsToMany(CustomerModel, {
  through: FavoriteModel,
  as: 'favoriteLocations',
  foreignKey: 'locationId'
});

StaffModel.hasMany(PositionModel, { foreignKey: 'staffId', sourceKey: 'id', as: 'positions' });
PositionModel.belongsTo(StaffModel, { foreignKey: 'staffId', as: 'staff' });

StaffModel.hasMany(PositionModel, { foreignKey: 'ownerId', sourceKey: 'id', as: 'listPosition' });
PositionModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

InvoiceModel.hasMany(InvoiceDetailModel, { foreignKey: 'invoiceId', sourceKey: 'id', as: 'invoiceDetails' });
InvoiceDetailModel.belongsTo(InvoiceModel, { foreignKey: 'invoiceId', as: 'invoice' });

CustomerWisereModel.hasMany(InvoiceModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'invoices' });
InvoiceModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

LocationModel.hasMany(InvoiceModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'invoices' });
InvoiceModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

TeamStaffModel.hasOne(StaffModel, { foreignKey: 'teamStaffId', sourceKey: 'id', as: 'staff' });
StaffModel.belongsTo(TeamStaffModel, { foreignKey: 'teamStaffId', as: 'teamStaff' });

CompanyModel.hasMany(TeamStaffModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'teamStaffs' });
TeamStaffModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

CustomerWisereModel.hasMany(ReceiptModel, { foreignKey: 'customerWisereId', sourceKey: 'id', as: 'receipts' });
ReceiptModel.belongsTo(CustomerWisereModel, { foreignKey: 'customerWisereId', as: 'customerWisere' });

LocationModel.hasMany(ReceiptModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'receipts' });
ReceiptModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location' });

PaymentModel.hasMany(ReceiptModel, { foreignKey: 'paymentId', sourceKey: 'id', as: 'receipts' });
ReceiptModel.belongsTo(PaymentModel, { foreignKey: 'paymentId', as: 'payment' });

StaffModel.hasMany(ReceiptModel, { foreignKey: 'staffId', sourceKey: 'id', as: 'receipts' });
ReceiptModel.belongsTo(StaffModel, { foreignKey: 'staffId', as: 'staff' });

PaymentMethodModel.hasMany(PaymentModel, { foreignKey: 'paymentMethodId', sourceKey: 'id', as: 'payments' });
PaymentModel.belongsTo(PaymentMethodModel, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });

ProviderModel.hasMany(PaymentModel, { foreignKey: 'providerId', sourceKey: 'id', as: 'payments' });
PaymentModel.belongsTo(ProviderModel, { foreignKey: 'providerId', as: 'provider' });

StaffModel.hasMany(CustomerWisereModel, { foreignKey: 'ownerId', sourceKey: 'id', as: 'customerWiseres' });
CustomerWisereModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

export {
  sequelize,
  StaffModel,
  CompanyModel,
  CompanyDetailModel,
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
  MarketPlaceFieldsModel,
  FavoriteModel,
  InvoiceModel,
  InvoiceDetailModel,
  InvoiceDetailStaffModel,
  PaymentModel,
  ReceiptModel,
  TeamStaffModel,
  DiscountModel,
  PaymentMethodModel,
  ProviderModel,
  TipsModel,
  PositionModel
};
