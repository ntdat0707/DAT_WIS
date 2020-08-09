import HttpStatus from 'http-status-codes';

import { CustomError } from '../../../utils/error-handlers';
import { bookingErrorDetails } from '../../../utils/response-messages/error-details';
import { StaffModel, ServiceModel, ResourceModel, LocationModel } from '../../../repositories/postgres/models';

import { IAppointmentDetailInput } from '../configs/interfaces';

export class BaseController {
  protected verifyAppointmentDetails = async (
    appointmentDetails: IAppointmentDetailInput[],
    locationId: string
  ): Promise<IAppointmentDetailInput[] | CustomError> => {
    try {
      if (!appointmentDetails || appointmentDetails.length < 1)
        return new CustomError(bookingErrorDetails.E_2000(), HttpStatus.BAD_REQUEST);
      const serviceTasks = [];
      const resourceTasks = [];
      const staffTasks = [];
      for (let i = 0; i < appointmentDetails.length; i++) {
        serviceTasks.push(
          ServiceModel.findOne({
            // attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('id')), 'id']],
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
                model: ResourceModel,
                as: 'resources',
                required: true,
                where: { id: appointmentDetails[i].resourceId },
                through: { attributes: [] }
              },
              {
                model: LocationModel,
                as: 'locations',
                required: true,
                where: { id: locationId }
              }
            ]
          })
        );
        // resource
        resourceTasks.push(
          ResourceModel.findOne({
            where: {
              id: appointmentDetails[i].resourceId,
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
      const serviceIdsFind: string[] = [];
      servicesFind.forEach((e) => {
        try {
          if (e) serviceIdsFind.push(e.id);
        } catch (error) {
          throw error;
        }
      });
      const serviceIds = [...new Set(serviceIdsFind)];
      const resourcesFind = await Promise.all(resourceTasks);
      const resourceIdsFind: string[] = [];
      resourcesFind.forEach((e) => {
        if (e) resourceIdsFind.push(e.id);
      });
      const resourceIds = [...new Set(resourceIdsFind)];

      const staffsFind = await Promise.all(staffTasks);
      const staffs: StaffModel[][] = [];
      staffsFind.forEach((e) => {
        if (e) staffs.push(e);
      });
      if (
        serviceIds.length !== appointmentDetails.length ||
        resourceIds.length !== appointmentDetails.length ||
        staffs.length !== appointmentDetails.length
      ) {
        return new CustomError(
          bookingErrorDetails.E_2001('service or resource or staff not match'),
          HttpStatus.BAD_REQUEST
        );
      }
      for (let j = 0; j < appointmentDetails.length; j++) {
        const tmpStaffIds: string[] = [];
        staffs[j].forEach((e) => {
          if (e) tmpStaffIds.push(e.id);
        });
        const staffIds = [...new Set(tmpStaffIds)];
        if (staffIds.length !== appointmentDetails[j].staffIds.length) {
          return new CustomError(bookingErrorDetails.E_2001('Staff not match'), HttpStatus.BAD_REQUEST);
        }
      }
      return appointmentDetails;
    } catch (error) {
      throw error;
    }
  };
}
