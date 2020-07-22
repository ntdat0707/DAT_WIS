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

enum EAppointmentStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled'
}
const AppointmentStatusMetric = {
  // NEW: { CONFIRMED: { up: true, down: true }, CANCELED: { up: true, down: false } }
  new: { confirmed: true, canceled: true },
  confirmed: { new: true, canceled: true },
  canceled: { new: false, canceled: false }
};

export { buildingEnvs, ELocales, EEnvironments, EGender, ELocationStatus, EAppointmentStatus, AppointmentStatusMetric };
