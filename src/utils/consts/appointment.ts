enum EAppointmentStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  IN_SERVICE = 'in_service',
  COMPLETED = 'completed',
  CANCEL = 'cancel',
  NO_SHOW = 'no_show'
}
const AppointmentStatusRules = {
  new: { new: false, confirmed: true, arrived: true, in_service: true, completed: true, cancel: true, no_show: true },
  confirmed: {
    new: true,
    confirmed: false,
    arrived: true,
    in_service: true,
    completed: true,
    cancel: true,
    no_show: true
  },
  arrived: {
    new: true,
    confirmed: true,
    arrived: false,
    in_service: true,
    completed: true,
    cancel: true,
    no_show: true
  },
  in_service: {
    new: true,
    confirmed: true,
    arrived: true,
    in_service: false,
    completed: true,
    cancel: true,
    no_show: true
  },
  completed: {
    new: false,
    confirmed: false,
    arrived: false,
    in_service: false,
    completed: false,
    cancel: false,
    no_show: false
  },
  cancel: {
    new: false,
    confirmed: false,
    arrived: false,
    in_service: false,
    completed: false,
    cancel: false,
    no_show: false
  },
  no_show: {
    new: true,
    confirmed: false,
    arrived: false,
    in_service: false,
    completed: false,
    cancel: false,
    no_show: false
  }
};

// interface IManagementLockAppointmentData {
//   staffs: {
//     locationId: string;
//     data: { id: string; time: { start: Date; end?: Date } }[];
//   }[];
//   services: {
//     locationId: string;
//     data: { id: string; time: { start: Date; end?: Date } }[];
//   };
//   resources?: {
//     locationId: string;
//     data: { id: string; time: { start: Date; end?: Date } }[];
//   };
// }

interface IManagementLockAppointmentData {
  id: string;
  appointmentId: string;
  startTime: Date;
  serviceId: string;
  resourceId: any;
  duration: any;
  status: string;
  createdAt: Date;
  updateAt: Date;
  deletedAt: any;
  appointment: {
    id: string;
    customerId: string;
    locationId: string;
    appointmentGroupId: any;
    isPrimary: boolean;
    status: string;
    date: Date;
    cancelReason: any;
    bookingSource: string;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
    location: {
      id: string;
      companyId: string;
      name: string;
      phone: string;
      email: string;
      photo: any;
      status: string;
      city: any;
      district: any;
      ward: any;
      address: any;
      latitude: any;
      longitude: any;
      createdAt: Date;
      updateAt: Date;
      deletedAt: any;
    };
    customer: {
      id: string;
      firstName: string;
      lastName: any;
      gender: number;
      phone: any;
      email: string;
      birthDate: any;
      passportNumber: any;
      address: any;
      companyId: any;
      password: any;
      otpCode: any;
      facebookId: any;
      appleId: any;
      googleId: any;
      avatarPath: any;
      createdAt: Date;
      updateAt: Date;
      deletedAt: any;
    };
  };
  service: {
    id: string;
    name: string;
    status: string;
    cateServiceId: string;
    serviceCode: string;
    description: string;
    salePrice: number;
    duration: number;
    color: string;
    isAllowedMarketplace: boolean;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
  };
  resource: any;
  staffs: {
    id: string;
    password: any;
    firstName: string;
    lastName: any;
    gender: number;
    phone: any;
    email: any;
    birthDate: any;
    isAllowedMarketPlace: boolean;
    passportNumber: any;
    teamStaffId: any;
    isBusinessAccount: boolean;
    facebookId: any;
    appleId: any;
    googleId: any;
    avatarPath: any;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
  };
}

interface IManagementEditAppointmentDetailData {
  oldAppointmentDetailId: string;
  id: string;
  appointmentId: string;
  startTime: Date;
  serviceId: string;
  resourceId: any;
  duration: any;
  status: string;
  createdAt: Date;
  updateAt: Date;
  deletedAt: any;
  appointment: {
    id: string;
    customerId: string;
    locationId: string;
    appointmentGroupId: any;
    isPrimary: boolean;
    status: string;
    date: Date;
    cancelReason: any;
    bookingSource: string;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
    location: {
      id: string;
      companyId: string;
      name: string;
      phone: string;
      email: string;
      photo: any;
      status: string;
      city: any;
      district: any;
      ward: any;
      address: any;
      latitude: any;
      longitude: any;
      createdAt: Date;
      updateAt: Date;
      deletedAt: any;
    };
    customer: {
      id: string;
      firstName: string;
      lastName: any;
      gender: number;
      phone: any;
      email: string;
      birthDate: any;
      passportNumber: any;
      address: any;
      companyId: any;
      password: any;
      otpCode: any;
      facebookId: any;
      appleId: any;
      googleId: any;
      avatarPath: any;
      createdAt: Date;
      updateAt: Date;
      deletedAt: any;
    };
  };
  service: {
    id: string;
    name: string;
    status: string;
    cateServiceId: string;
    serviceCode: string;
    description: string;
    salePrice: number;
    duration: number;
    color: string;
    isAllowedMarketplace: boolean;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
  };
  resource: any;
  staffs: {
    id: string;
    password: any;
    firstName: string;
    lastName: any;
    gender: number;
    phone: any;
    email: any;
    birthDate: any;
    isAllowedMarketPlace: boolean;
    passportNumber: any;
    teamStaffId: any;
    isBusinessAccount: boolean;
    facebookId: any;
    appleId: any;
    googleId: any;
    avatarPath: any;
    createdAt: Date;
    updateAt: Date;
    deletedAt: any;
  };
}

export {
  EAppointmentStatus,
  AppointmentStatusRules,
  IManagementLockAppointmentData,
  IManagementEditAppointmentDetailData
};
