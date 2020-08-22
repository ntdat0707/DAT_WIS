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
    new: false,
    confirmed: false,
    arrived: false,
    in_service: false,
    completed: false,
    cancel: false,
    no_show: false
  }
};

interface IManagementLockAppointmentData {
  staffs: {
    locationId: string;
    data: { id: string; time: { start: Date; end?: Date } }[];
  }[];
  services: {
    locationId: string;
    data: { id: string; time: { start: Date; end?: Date } }[];
  };
  resources?: {
    locationId: string;
    data: { id: string; time: { start: Date; end?: Date } }[];
  };
}

export { EAppointmentStatus, AppointmentStatusRules, IManagementLockAppointmentData };
