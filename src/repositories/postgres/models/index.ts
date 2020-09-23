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
import { PipelineModel } from './pipeline-model';
import { PipelineStageModel } from './pipeline-stage-model';
import { DealModel } from './deal-model';

StaffModel.hasOne(CompanyModel, { foreignKey: 'ownerId', as: 'hasCompany' });
CompanyModel.belongsTo(StaffModel, { foreignKey: 'ownerId', as: 'owner' });

CompanyModel.hasMany(LocationModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'locations' });
LocationModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

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

CompanyModel.hasMany(CustomerModel, { foreignKey: 'companyId', sourceKey: 'id', as: 'customers' });
CustomerModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

PipelineModel.hasMany(PipelineStageModel, { foreignKey: 'pipelineId', sourceKey: 'id', as: 'pipelineStage' });
PipelineStageModel.belongsTo(PipelineModel, { foreignKey: 'pipelineId', as: 'pipeline' });

StaffModel.hasMany(PipelineModel, { foreignKey: 'staffId', sourceKey: 'id', as: 'pipeline' });
PipelineModel.belongsTo(StaffModel, { foreignKey: 'staffId', as: 'staff' });

StaffModel.hasMany(DealModel, { foreignKey: 'createdBy', sourceKey: 'id', as: 'deal' });
DealModel.belongsTo(StaffModel, { foreignKey: 'createdBy', as: 'staff' });

CustomerModel.hasMany(DealModel, { foreignKey: 'customerId', sourceKey: 'id', as: 'deal' });
DealModel.belongsTo(CustomerModel, { foreignKey: 'customerId', as: 'customer' });

PipelineStageModel.hasMany(DealModel, { foreignKey: 'pipelineStageId', sourceKey: 'id', as: 'deal' });
DealModel.belongsTo(PipelineStageModel, { foreignKey: 'pipelineStageId', as: 'pipelineStage' });

export {
  sequelize,
  StaffModel,
  CompanyModel,
  CustomerModel,
  LocationModel,
  ServiceModel,
  ResourceModel,
  LocationStaffModel,
  AppointmentModel,
  AppointmentDetailModel,
  AppointmentDetailStaffModel,
  AppointmentGroupModel,
  LocationWorkingHourModel,
  PipelineModel,
  PipelineStageModel,
  DealModel
};
