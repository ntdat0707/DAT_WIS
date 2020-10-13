import { ESourceType } from './../../../utils/consts/index';
import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ReceiptModel extends Model {
  public id: string;
  public code: string;
  public customerId!: string;
  public staffId!: string;
  public amount: number;
  public paymentId: string;
  public type: string;
  public locationId: string;
  public description: string;
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
    customerId: {
      field: 'customer_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    paymentId: {
      field: 'payment_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    type: {
      field: 'type',
      type: DataTypes.ENUM(...Object.keys(ESourceType)),
      defaultValue: ESourceType.POS
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
