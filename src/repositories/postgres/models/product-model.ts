import { Model, DataTypes, Sequelize } from 'sequelize';
import { ETraceability } from '../../../utils/consts';
import sequelize from '../configs/db-connector';
class ProductModel extends Model {
  public id: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductModel.init(
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
    supplierId: {
      field: 'supplier_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    brandId: {
      field: 'brand_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    originId: {
      field: 'origin_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    volume: {
      field: 'volume',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      field: 'description',
      type: DataTypes.TEXT,
      allowNull: true
    },
    traceability: {
      field: 'traceability',
      type: DataTypes.ENUM(...Object.values(ETraceability)),
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
    tableName: 'product',
    timestamps: true,
    paranoid: true
  }
);

export { ProductModel };
