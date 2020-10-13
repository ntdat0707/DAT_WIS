import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class InvoiceDetail extends Model {
  public id: string;
  public invoiceId!: string;
  public item!: string;
  public unit?: string;
  public quantity!: number;
  public price!: number;
  public discount?: number;
  public tax!: number;
  public balance: number;
  public staffId?: number;
  public subTotal?: number;
  public readonly total: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

InvoiceDetail.init(
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
    item: {
      field: 'item',
      type: DataTypes.STRING,
      allowNull: false
    },
    unit: {
      field: 'unit',
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      field: 'quantity',
      type: DataTypes.NUMBER,
      allowNull: true
    },
    price: {
      field: 'price',
      type: DataTypes.NUMBER,
      allowNull: false
    },
    discount: {
      field: 'discount',
      type: DataTypes.NUMBER,
      allowNull: true
    },
    tax: {
      field: 'tax',
      type: DataTypes.NUMBER,
      allowNull: true
    },
    balance: {
      field: 'balance',
      type: DataTypes.NUMBER,
      allowNull: true
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    subTotal: {
      field: 'sub_total',
      type: DataTypes.NUMBER,
      allowNull: true
    },
    total: {
      field: 'total',
      type: DataTypes.NUMBER,
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
    tableName: 'invoice_detail',
    timestamps: true,
    paranoid: true
  }
);

export { InvoiceDetail };
