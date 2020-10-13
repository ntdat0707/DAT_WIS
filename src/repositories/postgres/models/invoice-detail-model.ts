import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class InvoiceDetail extends Model {
  public id: string;
  public invoiceId!: string;
  public serviceId!: string;
  public unit?: number;
  public quantity!: number;
  public price!: number;
  public staffId?: number;
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
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    unit: {
      field: 'unit',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      field: 'quantity',
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    price: {
      field: 'price',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
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
    tableName: 'invoice_detail',
    timestamps: true,
    paranoid: true
  }
);

export { InvoiceDetail };
