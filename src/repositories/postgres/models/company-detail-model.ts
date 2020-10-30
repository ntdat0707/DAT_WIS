import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EBusinessType } from '../../../utils/consts';
class CompanyDetailModel extends Model {
  public id: string;
  public description!: string;
  public companyId: string;
  public businessType?: string;
  public businessName: string;
  public phone: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CompanyDetailModel.init(
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
    businessType: {
      field: 'business_type',
      type: DataTypes.ENUM(...Object.values(EBusinessType)),
      allowNull: true
    },
    businessName: {
      field: 'business_name',
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      field: 'phone',
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      field: 'description',
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
    tableName: 'company_detail',
    timestamps: true,
    paranoid: true
  }
);

export { CompanyDetailModel };
