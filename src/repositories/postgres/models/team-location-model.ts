import { Model, DataTypes, Sequelize } from 'sequelize';

import sequelize from '../configs/db-connector';
class TeamLocationModel extends Model {
  public id: string;
  public locationId!: string;
  public teamId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

TeamLocationModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    teamId: {
      field: 'team_id',
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
    sequelize,
    freezeTableName: true,
    tableName: 'team_location'
  }
);

export { TeamLocationModel };
