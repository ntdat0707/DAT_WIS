import { EBalanceType } from './../../../utils/consts/index';
import { Model, DataTypes, Sequelize } from 'sequelize';
import { ESourceType } from '../../../utils/consts';
import sequelize from '../configs/db-connector';

class InvoiceModel extends Model {
  public id: string;
  public code!: string;
  public locationId!: string;
  public appointmentId?: string;
  public source: string;
  public note: string;
  public discount?: number;
  public tax!: number;
  public balance!: number;
  public status!: string;
  public subTotal?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
InvoiceModel.init(
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
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    appointmentId: {
      field: 'appointment_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    source: {
      field: 'source',
      type: DataTypes.ENUM(...Object.keys(ESourceType)),
      defaultValue: ESourceType.POS
    },
    discount: {
      field: 'discount',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tax: {
      field: 'tax',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(...Object.keys(EBalanceType)),
      defaultValue: EBalanceType.UNPAID
    },
    balance: {
      field: 'balance',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subTotal: {
      field: 'sub_total',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    note: {
      field: 'note',
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
    tableName: 'invoice',
    timestamps: true,
    paranoid: true
  }
);

export { InvoiceModel };
