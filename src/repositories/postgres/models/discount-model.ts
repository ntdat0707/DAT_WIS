import { Model, DataTypes, Sequelize } from 'sequelize';
import { EDiscountType } from '../../../utils/consts';
import sequelize from '../configs/db-connector';

class DiscountModel extends Model {
  public id: string;
  public companyId!: string;
  public name: string;
  public code!: number;
  public amount: number;
  public type!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
DiscountModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      field: 'name',
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      field: 'code',
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      field: 'amount',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      field: 'type',
      type: DataTypes.ENUM(EDiscountType.CASH, EDiscountType.PERCENT),
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
    tableName: 'discount',
    timestamps: true,
    paranoid: true
  }
);

export { DiscountModel };
