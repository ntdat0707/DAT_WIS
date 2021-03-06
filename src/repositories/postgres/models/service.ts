import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EExtraTimeType, EServiceStatus } from '../../../utils/consts';

class ServiceModel extends Model {
  public id: string;
  public status!: string;
  public cateServiceId!: string;
  public description: string;
  public salePrice: number;
  public duration: number;
  public color: string;
  public serviceCode: string;
  public name: string;
  public isAllowedMarketplace!: boolean;
  public allowGender: number;
  public extraTimeType: string;
  public extraTimeDuration: number;
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
    serviceCode: {
      field: 'service_code',
      type: DataTypes.STRING(125),
      allowNull: false
    },
    description: {
      field: 'description',
      type: DataTypes.STRING(5000),
      allowNull: true
    },
    salePrice: {
      field: 'sale_price',
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    duration: {
      field: 'duration',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      field: 'color',
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isAllowedMarketplace: {
      field: 'is_allowed_marketplace',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    allowGender: {
      type: DataTypes.TINYINT,
      field: 'allow_gender',
      allowNull: true
    },
    extraTimeType: {
      field: 'extra_time_type',
      type: DataTypes.ENUM(EExtraTimeType.BLOCKED, EExtraTimeType.PROCESSING),
      allowNull: true
    },
    extraTimeDuration: {
      field: 'extra_time_duration',
      type: DataTypes.INTEGER,
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
    tableName: 'service',
    timestamps: true,
    paranoid: true
  }
);

export { ServiceModel };
