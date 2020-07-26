interface IAppointmentDetailInput {
  appointmentId?: string;
  serviceId: string;
  staffIds: string[];
  resourceId: string;
  startTime: Date;
}

interface IAppointmentInput {
  locationId: string;
  customerId?: string;
  date: Date;
  appointmentDetails: IAppointmentDetailInput[];
}

export { IAppointmentDetailInput, IAppointmentInput };
