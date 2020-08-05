import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class LocationServiceModel extends Model {
  public id: string;
  public serviceId!: string;
  public locationId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

LocationServiceModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    locationId: {
      field: 'location_id',
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
    tableName: 'location_services',
    timestamps: true,
    paranoid: true
  }
);

export { LocationServiceModel };
