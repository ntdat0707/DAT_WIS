import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductImageModel extends Model {
  public id: string;
  public productId!: string;
  public path!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductImageModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productVariantId: {
      field: 'product_variant_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    path: {
      field: 'path',
      type: DataTypes.TEXT,
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
    tableName: 'product_image',
    timestamps: true,
    paranoid: true
  }
);

export { ProductImageModel };
