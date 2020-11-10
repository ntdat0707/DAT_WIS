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
  UNISEX = 0,
  FEMALE = 1,
  MALE = 2
}

enum EPayment {
  CASH = 'cash',
  CARD = 'card',
  ALL = 'all'
}

enum ELocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

enum EParkingStatus {
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
  NEWEST = 'newest',
  PRICE_LOWEST = 'price_lowest',
  PRICE_HIGHEST = 'price_highest'
}

enum ETypeMarketPlaceField {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN'
}

enum ESearchBy {
  COMPANY = 'company',
  CATE_SERVICE = 'cate-service',
  CITY = 'city',
  SERVICE = 'service'
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
  ESearchBy,
  ETypeMarketPlaceField,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData
};

export enum EAppointmentBookingSource {
  SCHEDULED = 'SCHEDULED',
  MARKETPLACE = 'MARKETPLACE',
  WALK_IN = 'WALK_IN'
}

export enum EStatusPipelineStage {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost'
}

export enum ESource {
  FACEBOOK = 'Facebook',
  ZALO = 'Zalo',
  SHOPEE = 'Shopee',
  WISERE = 'Wisere',
  MARKETPLACE = 'Marketplace',
  OTHER = 'Other'
}

export enum ELabel {
  CUSTOMER = 'customer',
  HOT_LEAD = 'hot_lead',
  WARM_LEAD = 'warm_lead',
  COLD_LEAD = 'cold_lead',
  NONE = 'none'
}

export enum EContactType {
  WORK = 'work',
  HOME = 'home',
  OTHER = 'other',
  MOBILE = 'mobile'
}

export enum EInvoiceSourceType {
  POS = 'pos',
  WEBSITE = 'website',
  FACEBOOK = 'facebook',
  MARKETPLACE = 'marketplace',
  OTHER = 'other'
}

export enum EPaymentType {
  CASH = 'cash',
  CARD = 'card',
  TRANFER = 'tranfer',
  GIFT_CARD = 'gift_card'
}

export enum EBalanceType {
  PAID = 'paid',
  PART_PAID = 'part_paid',
  UNPAID = 'unpaid'
}

export enum ESourceLoginType {
  WEB = 'WEB',
  IOS = 'IOS',
  ANDROID = 'ANDROID'
}

export enum EExtraTimeType {
  PROCESSING = 'PROCESSING',
  BLOCKED = 'BLOCKED'
}

export enum EDiscountType {
  CASH = 'cash',
  PERCENT = 'percent'
}

export enum EPaymentMethodType {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
  OTHER = 'other'
}

export enum ETeamStaffType {
  MANAGER = 'manager',
  MEMBER = 'member'
}

export enum ETypeOfReceipt {
  INVOICE = 'invoice',
  ORDER = 'order'
}

export enum EStatusRole {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum ERoleDefault {
  SUPER_ADMIN = 'Super admin',
  ADMIN = 'Admin',
  STAFF = 'Staff',
  NORMAL_USER = 'Normal user'
}
