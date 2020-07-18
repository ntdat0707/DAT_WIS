import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ServiceModel extends Model {
  public id: string;
  public status!: string;
  public categoryServiceId!: string;
  public branchId!: string;
  public description: string;
  public salePrice: number;
  public duration: number;
  public color: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ServiceModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      field: 'status',
      type: DataTypes.TINYINT,
      allowNull: false
    },
    categoryServiceId: {
      field: 'category_service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    branchId: {
      field: 'branch_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    description: {
      field: 'description',
      type: DataTypes.STRING(5000),
      allowNull: false
    },
    salePrice: {
      field: 'sale_price',
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    duration: {
      field: 'duration',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      field: 'color',
      type: DataTypes.STRING(100),
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
    sequelize: sequelize,
    freezeTableName: true,
    tableName: 'service',
    timestamps: true,
    paranoid: true
  }
);

export { ServiceModel };
