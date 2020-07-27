import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ELocationStatus } from '../../../utils/consts';

class LocationModel extends Model {
  public id: string;
  public companyId!: string;
  public name!: string;
  public phone!: string;
  public email: string;
  public photo: string;
  public status!: ELocationStatus;
  public city: string;
  public district: string;
  public ward: string;
  public address: string;
  public latitude: number;
  public longitude: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

LocationModel.init(
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
    name: {
      field: 'name',
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      field: 'phone',
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      field: 'email',
      type: DataTypes.STRING
    },
    photo: {
      field: 'photo',
      type: DataTypes.STRING
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE)
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
    tableName: 'location',
    timestamps: true,
    paranoid: true
  }
);

export { LocationModel };
