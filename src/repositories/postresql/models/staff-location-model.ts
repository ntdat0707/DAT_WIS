import { Model, DataTypes, Sequelize } from 'sequelize';

import sequelize from '../configs/db-connector';

class StaffLocationModel extends Model {
  public id: string;
  public staffId!: string;
  public locationId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

StaffLocationModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    staffId: {
      field: 'staff_id',
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
    tableName: 'staff_location'
  }
);

export { StaffLocationModel };
