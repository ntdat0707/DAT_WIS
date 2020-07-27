const buildingEnvs = ['develop', 'development', 'staging', 'test', 'testing'];

enum ELocales {
  VIETNAMESE = 'vi',
  ENGLISH = 'en',
}

enum EEnvironments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  TESTING = 'testing',
  PRODUCTION = 'production',
}

enum EGender {
  FEMALE = 0,
  MALE = 1,
  UNISEX = 3,
}

enum ELocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
enum EServiceStatus {
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active',
}

enum EAppointmentStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  IN_SERVICE = 'in_service',
  COMPLETED = 'completed',
  CANCEL = 'cancel',
}
const AppointmentStatusRules = {
  new: { new: false, confirmed: true, arrived: true, in_service: true, completed: true, cancel: true },
  confirmed: { new: true, confirmed: false, arrived: true, in_service: true, completed: true, cancel: true },
  arrived: { new: true, confirmed: true, arrived: false, in_service: true, completed: true, cancel: true },
  in_service: { new: true, confirmed: true, arrived: true, in_service: false, completed: true, cancel: true },
  completed: { new: false, confirmed: false, arrived: false, in_service: false, completed: false, cancel: false },
  cancel: { new: false, confirmed: false, arrived: false, in_service: false, completed: false, cancel: false },
};

export {
  buildingEnvs,
  EServiceStatus,
  ELocales,
  EEnvironments,
  EGender,
  ELocationStatus,
  EAppointmentStatus,
  AppointmentStatusRules,
};
