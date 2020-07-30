import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EServiceStatus } from '../../../utils/consts';

class ServiceModel extends Model {
  public id: string;
  public status!: string;
  public cateServiceId!: string;
  public locationId!: string;
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
    name: {
      field: 'name',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(EServiceStatus.ACTIVE, EServiceStatus.IN_ACTIVE),
      defaultValue: EServiceStatus.ACTIVE,

      allowNull: false
    },
    cateServiceId: {
      field: 'cate_service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    locationId: {
      field: 'location_id',
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
    sequelize,
    freezeTableName: true,
    tableName: 'service',
    timestamps: true,
    paranoid: true
  }
);

export { ServiceModel };
