import { Model, DataTypes, Sequelize } from 'sequelize';

import sequelize from '../configs/db-connector';

class AppointmentDetailModel extends Model {
  public id: string;
  public appointmentId!: string;
  public locationId!: string;
  public startTime!: Date;
  public serviceId!: string;
  public resourceId!: string;
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
      type: DataTypes.UUIDV4,
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    deletedAt: {
      field: 'deleted_at',
      type: 'TIMESTAMP',
      defaultValue: null
    }
  },
  {
    sequelize: sequelize,
    freezeTableName: true,
    tableName: 'appointment_detail',
    timestamps: true,
    paranoid: true
  }
);

export { AppointmentDetailModel };
