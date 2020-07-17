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

export { buildingEnvs, ELocales, EEnvironments, EGender, ELocationStatus };
