import {
  EAppointmentStatus,
  AppointmentStatusRules,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData
} from './appointment';
import { EBusinessPlanType, BusinessPlanTypeRules } from './businessplantype';
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

enum ETypeOfPeople {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ORGANIZATION = 'ORGANIZATION'
}

enum ETypeCustomField {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  FILES = 'FILES',
  PEOPLE = 'PEOPLE',
  PHONE = 'PHONE',
  MONEY = 'MONEY',
  WEBSITE = 'WEBSITE',
  FORMULA = 'FORMULA',
  LOCATION = 'LOCATION',
  RATING = 'RATING'
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
  ETypeCustomField,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData,
  ETypeOfPeople,
  EBusinessPlanType,
  BusinessPlanTypeRules
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
  TRANSFER = 'transfer',
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

export enum ETeeth {
  ADULT = 'adult',
  KID = 'kid'
}

export enum EDiagnosis {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  RESOLVED = 'resolved'
}

export enum EStatusProcedure {
  NEW = 'new',
  INPROGRESS = 'in-progress',
  COMPLETE = 'complete',
  REJECT = 'reject'
}

export enum EStatusTreatment {
  PLANNING = 'planning',
  CONFIRMED = 'confirmed',
  COMPLETE = 'complete'
}

export enum EQuotationDiscountType {
  PERCENT = 'percent',
  MONEY = 'money'
}

export enum EQuotationCurrencyUnit {
  USD = 'usd',
  VND = 'vnd'
}

export enum EQuotationTeethType {
  ADULT = 'adult',
  CHILD = 'child'
}
export enum EMedicalDocumentStatusType {
  RE_TREATMENT = 're-treatment',
  DURING_TREATMENT = 'during-treatment',
  AFTER_TREATMENT = 'after-treatment',
  OTHER = 'other'
}

export enum ETraceability {
  NO_TRACKING = 'NO_TRACKING',
  BY_LOTS = 'BY_LOTS',
  BY_UNIQUE_SERIAL_NUMBER = 'BY_UNIQUE_SERIAL_NUMBER'
}
