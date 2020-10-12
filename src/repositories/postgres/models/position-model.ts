import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
class PositionModel extends Model {
  public id: string;
  public staffId: string;
  public ownerId: string;
  public index: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

PositionModel.init(
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
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    index: {
      field: 'index',
      type: DataTypes.TINYINT,
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
    tableName: 'position',
    timestamps: true,
    paranoid: true
  }
);

export { PositionModel };
