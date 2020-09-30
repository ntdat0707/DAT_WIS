import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { BusinessType } from '../../../utils/consts';
class CompanyModel extends Model {
  public id: string;
  public ownerId: string;
  public businessType?: string;
  public businessName: string;
  public phone: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CompanyModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    // businessType: {
    //   field: 'business_type',
    //   type: DataTypes.ENUM(...Object.keys(BusinessType)),
    //   allowNull: true
    // },
    // businessName: {
    //   field: 'business_name',
    //   type: DataTypes.STRING,
    //   allowNull: true
    // },
    // phone: {
    //   field: 'phone',
    //   type: DataTypes.STRING,
    //   allowNull: true
    // },
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
    tableName: 'company',
    timestamps: true,
    paranoid: true
  }
);

export { CompanyModel };
