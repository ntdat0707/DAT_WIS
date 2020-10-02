import { Model, DataTypes, Sequelize } from 'sequelize';

import { EAppointmentStatus, AppointmentBookingSource } from '../../../utils/consts';
import sequelize from '../configs/db-connector';

class AppointmentModel extends Model {
  public id: string;
  public customerId: string;
  public customerWisereId: string;
  public locationId!: string;
  public appointmentGroupId: string;
  public status!: string;
  public date!: Date;
  public isPrimary!: boolean;
  public cancelReason: string;
  public bookingSource: string;
  public appointmentCode!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

AppointmentModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerId: {
      field: 'customer_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    customerWisereId: {
      field: 'customer_wisere_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    appointmentGroupId: {
      field: 'appointment_group_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(
        EAppointmentStatus.NEW,
        EAppointmentStatus.CONFIRMED,
        EAppointmentStatus.ARRIVED,
        EAppointmentStatus.IN_SERVICE,
        EAppointmentStatus.COMPLETED,
        EAppointmentStatus.CANCEL,
        EAppointmentStatus.NO_SHOW
      ),
      allowNull: false,
      defaultValue: EAppointmentStatus.NEW
    },
    date: {
      field: 'date',
      type: 'TIMESTAMP',
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    cancelReason: {
      field: 'cancel_reason',
      type: DataTypes.STRING,
      allowNull: true
    },
    appointmentCode: {
      field: 'appointment_code',
      type: DataTypes.STRING,
      allowNull: false
    },
    bookingSource: {
      field: 'booking_source',
      type: DataTypes.ENUM(...Object.keys(AppointmentBookingSource)),
      allowNull: false
    },
    createdAt: {
      field: 'created_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      field: 'updated_at',
      type: 'TIMESTAMP',
      defaultValue: null
    },
    deletedAt: {
      field: 'deleted_at',
      type: 'TIMESTAMP',
      defaultValue: null
    }
  },
  {
    sequelize,
    freezeTableName: true,
    tableName: 'appointment',
    timestamps: true,
    paranoid: true
  }
);

export { AppointmentModel };
