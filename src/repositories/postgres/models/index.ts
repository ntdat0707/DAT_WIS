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
import { LocationDetailModel } from './location-detail-model';

StaffModel.hasOne(CompanyModel, { foreignKey: 'ownerId', as: 'hasCompany' });
CompanyModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

CompanyModel.hasOne(CompanyDetailModel,{foreignKey: 'companyId',sourceKey:'id',as:'companyDetail'});
CompanyDetailModel.belongsTo(CompanyModel,{foreignKey: 'companyId',as:'companyDetail'});

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

LocationModel.hasOne(LocationDetailModel, { foreignKey: 'locationId', sourceKey: 'id', as: 'location-detail' });
LocationDetailModel.belongsTo(LocationModel, { foreignKey: 'locationId', as: 'location'  });

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

CompanyModel.hasMany(CustomerModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'customers' });
CustomerModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

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
  LocationDetailModel,
  AppointmentModel,
  AppointmentDetailModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  LocationWorkingHourModel
};
