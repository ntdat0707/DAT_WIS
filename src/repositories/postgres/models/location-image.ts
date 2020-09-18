import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class LocationImageModel extends Model {
  public id: string;
  public locationId!: string;
  public path!: string;
  public isAvatar!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

LocationImageModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    path: {
      field: 'path',
      type: DataTypes.TEXT,
      allowNull: false
    },
    isAvatar: {
      field: 'is_avatar',
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'location_image',
    timestamps: true,
    paranoid: true
  }
);

export { LocationImageModel };
