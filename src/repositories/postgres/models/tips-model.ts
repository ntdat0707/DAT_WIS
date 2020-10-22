import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class TipsModel extends Model {
  public id: string;
  public invoiceId!: string;
  public staffId!: string;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
TipsModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      field: 'invoice_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    amount: {
      field: 'amount',
      type: DataTypes.INTEGER,
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
    tableName: 'tips',
    timestamps: true,
    paranoid: true
  }
);

export { TipsModel };
