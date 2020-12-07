import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductVariantModel extends Model {
  public id: string;
  public productId!: string;
  public itemCode!: string;
  public path!: string;
  public isAvatar!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductVariantModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      field: 'product_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    itemCode: {
      field: 'item_code',
      type: DataTypes.STRING,
      allowNull: false
    },
    inStock: {
      field: 'in_stock',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      field: 'description',
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
    tableName: 'product_variant',
    timestamps: true,
    paranoid: true
  }
);

export { ProductVariantModel };
