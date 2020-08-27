import { Model, DataTypes, Sequelize } from 'sequelize';

import sequelize from '../configs/db-connector';
import { EAppointmentStatus } from '../../../utils/consts';

class AppointmentDetailModel extends Model {
  public id: string;
  public appointmentId!: string;
  public locationId!: string;
  public startTime!: Date;
  public duration!: number;
  public serviceId!: string;
  public resourceId: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

AppointmentDetailModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appointmentId: {
      field: 'appointment_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    startTime: {
      field: 'start_time',
      type: 'TIMESTAMP',
      allowNull: false
    },
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    resourceId: {
      field: 'resource_id',
      type: DataTypes.UUIDV4
    },
    duration: {
      field: 'duration',
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'appointment_detail',
    timestamps: true,
    paranoid: true
  }
);

export { AppointmentDetailModel };
