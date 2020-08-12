import { EAppointmentStatus, AppointmentStatusRules } from './appointment';
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
  UNISEX = 3
}

enum ELocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
enum EServiceStatus {
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active'
}

enum ESocialType {
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
  APPLE = 'apple'
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
  ESocialType
};
