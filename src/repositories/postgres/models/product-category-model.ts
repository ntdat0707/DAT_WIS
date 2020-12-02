import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductCategoryModel extends Model {
  public id: string;
  public productId!: string;
  public categoryId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductCategoryModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      field: 'product_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    cateProductId: {
      field: 'cate_product_id',
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
      defaultValue: null
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
    tableName: 'product_category',
    timestamps: true,
    paranoid: true
  }
);

export { ProductCategoryModel };
