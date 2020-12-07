enum EBusinessPlanType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}
const BusinessPlanTypeRules = {
  standard: {
    standard: true,
    basic: false,
    premium: false,
    enterprise: false
  },
  basic: {
    standard: false,
    basic: true,
    premium: false,
    enterprise: false
  },
  premium: {
    standard: false,
    basic: false,
    premium: true,
    enterprise: false
  },
  enterprise: {
    standard: false,
    basic: false,
    premium: false,
    enterprise: true
  }
};
export { EBusinessPlanType, BusinessPlanTypeRules };
