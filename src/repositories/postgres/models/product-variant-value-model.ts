import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductVariantValueModel extends Model {
  public id: string;
  public fieldId!: string;
  public locationId!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductVariantValueModel.init(
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
    variantFieldId: {
      field: 'variant_field_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    value: {
      field: 'value',
      type: DataTypes.STRING,
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
    tableName: 'product_variant_value',
    timestamps: true,
    paranoid: true
  }
);

export { ProductVariantValueModel };
