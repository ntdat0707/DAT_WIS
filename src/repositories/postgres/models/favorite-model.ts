import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class FavoriteModel extends Model {
  public id: string;
  public locationId!: string;
  public customerId!: string;
  public isFavorite!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
FavoriteModel.init(
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
    customerId: {
      field: 'customer_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    isFavorite: {
      field: 'is_favorite',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'favorite',
    timestamps: true,
    paranoid: true
  }
);
export { FavoriteModel };
