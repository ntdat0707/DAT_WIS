import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductMeasureModel extends Model {
  public id: string;
  public name!: string;
  public productVariantId!: string;
  public avatar!: string;
  public unit!: string;
  public barcode!: string;
  public quantity!: number;
  public purchasePrice!: number;
  public saleTax!: number;
  public salePrice!: number;
  public purchaseTax!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductMeasureModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      field: 'name',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    barcode: {
      field: 'barcode',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    productVariantId: {
      field: 'product_variant_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    unit: {
      field: 'unit',
      type: DataTypes.STRING(20),
      allowNull: true
    },
    quantity: {
      field: 'quantity',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    purchasePrice: {
      field: 'purchase_price',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    saleTax: {
      field: 'sale_tax',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    salePrice: {
      field: 'sale_price',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    purchaseTax: {
      field: 'purchase_tax',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    avatar: {
      field: 'avatar',
      type: DataTypes.TEXT,
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
    tableName: 'product_measure',
    timestamps: true,
    paranoid: true
  }
);

export { ProductMeasureModel };
