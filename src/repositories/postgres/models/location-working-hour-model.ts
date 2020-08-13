import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class LocationWorkingHourModel extends Model {
  public id: string;
  public locationId!: string;
  public weekday: string;
  public startTime: string;
  public endTime: string;
  public isEnabled: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

LocationWorkingHourModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    weekday: {
      field: 'weekday',
      type: DataTypes.STRING,
      allowNull: false
    },
    startTime: {
      field: 'start_time',
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      field: 'end_time',
      type: DataTypes.TIME,
      allowNull: false
    },
    isEnabled: {
      field: 'is_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'location_working_hour',
    timestamps: true,
    paranoid: true
  }
);

export { LocationWorkingHourModel };
