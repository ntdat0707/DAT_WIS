import HttpStatus from 'http-status-codes';

import { CustomError } from '../../../utils/error-handlers';
import { bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { IManagementLockAppointmentData } from '../../../utils/consts';
import { emit, EQueueNames } from '../../../utils/event-queues';
import { StaffModel, ServiceModel, ResourceModel, LocationModel } from '../../../repositories/postgres/models';

import { IAppointmentDetailInput, IAppointmentDetail } from '../configs/interfaces';

export class BaseController {
  protected verifyAppointmentDetails = async (
    appointmentDetails: IAppointmentDetailInput[],
    locationId: string
  ): Promise<IAppointmentDetail[]> => {
    try {
      if (!appointmentDetails || appointmentDetails.length < 1)
        throw new CustomError(bookingErrorDetails.E_2000(), HttpStatus.BAD_REQUEST);
      const serviceTasks = [];
      const resourceTasks = [];
      const staffTasks = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        const queryService: any = {
          where: {
            id: appointmentDetails[i].serviceId
          },
          include: [
            {
              model: StaffModel,
              as: 'staffs',
              required: true,
              where: { id: appointmentDetails[i].staffIds },
              through: { attributes: [] }
            },
            {
              model: LocationModel,
              as: 'locations',
              required: true,
              where: { id: locationId }
            }
          ]
        };
        if (appointmentDetails[i].resourceId) {
          queryService.include.push({
            model: ResourceModel,
            as: 'resources',
            required: true,
            where: { id: appointmentDetails[i].resourceId },
            through: { attributes: [] }
          });
        }

        serviceTasks.push(ServiceModel.findOne(queryService));
        // resource
        resourceTasks.push(
          ResourceModel.findOne({
            where: {
              id: appointmentDetails[i].resourceId ? appointmentDetails[i].resourceId : null,
              locationId
            },
            include: [
              {
                model: ServiceModel,
                as: 'services',
                required: true,
                where: { id: appointmentDetails[i].serviceId }
              }
            ]
          })
        );
        // staff
        staffTasks.push(
          StaffModel.findAll({
            where: { id: appointmentDetails[i].staffIds },
            include: [
              {
                model: LocationModel,
                as: 'workingLocations',
                required: true,
                where: { id: locationId }
              },
              {
                model: ServiceModel,
                as: 'services',
                required: true,
                where: { id: appointmentDetails[i].serviceId }
              }
            ]
          })
        );
      }
      const servicesFind = await Promise.all(serviceTasks);
      const resourcesFind = await Promise.all(resourceTasks);

      const staffsFind = await Promise.all(staffTasks);
      const staffs: StaffModel[][] = [];
      staffsFind.forEach((e) => {
        if (e) staffs.push(e);
      });
      if (servicesFind.length !== appointmentDetails.length) {
        throw new CustomError(bookingErrorDetails.E_2001('Service not match'), HttpStatus.BAD_REQUEST);
      }
      if (staffs.length !== appointmentDetails.length) {
        throw new CustomError(bookingErrorDetails.E_2001('Staff not match'), HttpStatus.BAD_REQUEST);
      }
      for (let j = 0; j < appointmentDetails.length; j++) {
        const tmpStaffIds: string[] = [];
        staffs[j].forEach((e) => {
          if (e) tmpStaffIds.push(e.id);
        });
        const staffIds = [...new Set(tmpStaffIds)];
        if (staffIds.length !== appointmentDetails[j].staffIds.length) {
          throw new CustomError(bookingErrorDetails.E_2001('Staff not match'), HttpStatus.BAD_REQUEST);
        }
        // verify resource
        if (appointmentDetails[j].resourceId) {
          if (!resourcesFind[j]) {
            throw new CustomError(bookingErrorDetails.E_2001('Resource not match'), HttpStatus.BAD_REQUEST);
          }
        }
      }
      const result = appointmentDetails.map((element, i) => ({
        ...element,
        ...{ duration: servicesFind[i].duration }
      }));
      return result;
    } catch (error) {
      throw error;
    }
  };
  protected pushNotifyLockAppointmentData = async (data: {
    locationId: string;
    serviceData: { id: string; time: { start: Date; end?: Date } }[];
    resourceData?: { id: string; time: { start: Date; end?: Date } }[];
    staffData: { ids: string[]; time: { start: Date; end?: Date } }[];
  }) => {
    try {
      const { locationId, resourceData, serviceData, staffData } = data;
      const staffIds = [];
      for (const s of staffData) {
        staffIds.push(...s.ids);
      }
      if (!staffIds.length) return;
      const locations = await LocationModel.findAll({
        include: [{ model: StaffModel, as: 'staffs', required: true, where: { id: staffIds } }]
      });
      if (!locations) return;
      const staffDataNotify = locations.map((location) => {
        const tmpStaffIds = (location as any).staffs.map((staff: any) => staff.id) as string[];

        const tmpData = [];
        for (const s of staffData) {
          for (const sid of tmpStaffIds) {
            if (s.ids.indexOf(sid) > -1) tmpData.push({ id: sid, time: s.time });
          }
        }
        return {
          locationId: location.id,
          data: tmpData
        };
      });
      const dataNotify: IManagementLockAppointmentData = {
        services: { locationId, data: serviceData },
        resources: resourceData ? { locationId, data: resourceData } : null,
        staffs: staffDataNotify
      };
      await emit(EQueueNames.LOCK_APPOINTMENT_DATA, dataNotify);
    } catch (error) {
      throw error;
    }
  };
}
