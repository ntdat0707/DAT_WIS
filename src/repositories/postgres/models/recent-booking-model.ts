import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class RecentBookingModel extends Model {
  public id: string;
  public customerId!: string;
  public appointmentId!: string;
  public locationId!: string;
  public serviceId!: string;
  public staffId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

RecentBookingModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerId: {
      field: 'customer_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    appointmentId: {
      field: 'appointment_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUID,
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
    sequelize,
    freezeTableName: true,
    tableName: 'recent_booking',
    timestamps: true,
    paranoid: true
  }
);

export { RecentBookingModel };
