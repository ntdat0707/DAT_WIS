import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ProductFieldModel extends Model {
  public id: string;
  public customFieldId!: string;
  public productId!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ProductFieldModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customFieldId: {
      field: 'custom_field_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    productId: {
      field: 'product_id',
      type: DataTypes.UUIDV4,
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
    tableName: 'product_field',
    timestamps: true,
    paranoid: true
  }
);

export { ProductFieldModel };
