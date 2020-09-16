import {
  EAppointmentStatus,
  AppointmentStatusRules,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData
} from './appointment';
const buildingEnvs = ['develop', 'development', 'staging', 'test', 'testing'];

enum ELocales {
  VIETNAMESE = 'vi',
  ENGLISH = 'en'
}

enum EEnvironments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  TESTING = 'testing',
  PRODUCTION = 'production'
}

enum EGender {
  FEMALE = 0,
  MALE = 1,
  UNISEX = 2
}

enum EPayment{
  CASH = 'cash',
  CARD = 'card',
  ALL = 'all'
}

enum ELocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

enum EParkingStatus{
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

enum EServiceStatus {
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active'
}

enum ESocialType {
  FACEBOOK = 'facebook',
  GOOGLE = 'google'
}

enum EFavorite {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

enum EWeekDays {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

enum EOrder {
  NEAREST = 'nearest',
  NEWEST = 'newest'
}

export {
  buildingEnvs,
  EServiceStatus,
  ELocales,
  EEnvironments,
  EGender,
  ELocationStatus,
  EAppointmentStatus,
  AppointmentStatusRules,
  ESocialType,
  EWeekDays,
  EPayment,
  EParkingStatus,
  EFavorite,
  EOrder,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData
};

export enum BusinessType {
  DENTAL = 'DENTAL',
  SPA = 'SPA',
  BEAUTY_SALON = 'BEAUTY_SALON',
  NAIL_SALON = 'NAIL_SALON',
  BABER_SHOP = 'BABER_SHOP',
  MASSAGE = 'MASSAGE'
}

export enum AppointmentBookingSource {
  STAFF = 'STAFF',
  MARKETPLACE = 'MARKETPLACE'
}
