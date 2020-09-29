import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class RecentViewModel extends Model {
  public id: string;
  public customerId!: string;
  public locationId!: string;
  public view: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

RecentViewModel.init(
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
      allowNull: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    view: {
      field: 'view',
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'recent_view',
    timestamps: true,
    paranoid: true
  }
);

export { RecentViewModel };
