import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class CateProductModel extends Model {
  public id: string;
  public companyId!: string;
  public parentId!: string;
  public name!: string;
  public description!: string;
  public code: string;
  public status: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CateProductModel.init(
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
    parentId: {
      field: 'parent_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    name: {
      field: 'name',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    code: {
      field: 'code',
      type: DataTypes.STRING(20),
      allowNull: false
    },
    description: {
      field: 'description',
      type: DataTypes.TEXT,
      allowNull: true
    },
    path: {
      field: 'path',
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      field: 'status',
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'cate_product',
    timestamps: true,
    paranoid: true
  }
);

export { CateProductModel };
