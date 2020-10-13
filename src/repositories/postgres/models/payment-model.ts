import { EPaymentType } from './../../../utils/consts/index';
import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class PaymentModel extends Model {
  public id: string;
  public invoiceId!: string;
  public type!: string;
  public amount!: number;
  public readonly total: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

PaymentModel.init(
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
    type: {
      field: 'type',
      type: DataTypes.ENUM(...Object.keys(EPaymentType)),
      defaultValue: EPaymentType.CASH
    },
    amount: {
      field: 'amount',
      type: DataTypes.INTEGER,
      allowNull: true
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
    tableName: 'payment',
    timestamps: true,
    paranoid: true
  }
);

export { PaymentModel };
