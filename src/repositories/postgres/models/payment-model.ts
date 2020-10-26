import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class PaymentModel extends Model {
  public id: string;
  public invoiceId!: string;
  public paymentMethodId!: string;
  public amount!: number;
  public providerId: string;
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
    paymentMethodId: {
      field: 'payment_method_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    amount: {
      field: 'amount',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    providerId: {
      field: 'provider_id',
      type: DataTypes.UUIDV4,
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
