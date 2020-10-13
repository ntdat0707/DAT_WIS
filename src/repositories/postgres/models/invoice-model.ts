import { Model, DataTypes, Sequelize } from 'sequelize';
import { ESourceType } from '../../../utils/consts';
import sequelize from '../configs/db-connector';

class InvoiceModel extends Model {
  public id: string;
  public code!: string;
  public locationId!: string;
  public reference?: string;
  public source: string;
  public note: string;
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
    reference: {
      field: 'reference',
      type: DataTypes.STRING,
      allowNull: true
    },
    source: {
      field: 'source',
      type: DataTypes.ENUM(...Object.keys(ESourceType)),
      defaultValue: ESourceType.POS
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
