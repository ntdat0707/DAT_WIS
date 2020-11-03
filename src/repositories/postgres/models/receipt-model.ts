import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ReceiptModel extends Model {
  public id: string;
  public code: string;
  public customerWisereId!: string;
  public staffId!: string;
  public amount: number;
  public locationId: string;
  public description: string;
  public paymentMethodId: string;
  public providerId: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ReceiptModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      field: 'code',
      type: DataTypes.STRING,
      allowNull: false
    },
    customerWisereId: {
      field: 'customer_wisere_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    amount: {
      field: 'amount',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      field: 'description',
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethodId: {
      field: 'payment_method_id',
      type: DataTypes.UUIDV4,
      allowNull: false
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
    tableName: 'receipt',
    timestamps: true,
    paranoid: true
  }
);

export { ReceiptModel };
