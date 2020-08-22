interface IAppointmentDetailInput {
  appointmentId?: string;
  serviceId: string;
  staffIds: string[];
  resourceId: string;
  startTime: Date;
}
interface IAppointmentDetail {
  appointmentId?: string;
  serviceId: string;
  staffIds: string[];
  resourceId: string;
  startTime: Date;
  duration: number;
}

interface IAppointmentInput {
  locationId: string;
  customerId?: string;
  date: Date;
  appointmentDetails: IAppointmentDetailInput[];
}

export { IAppointmentDetailInput, IAppointmentInput, IAppointmentDetail };
