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
  public cityId: string;
  public district: string;
  public ward: string;
  public address: string;
  public latitude: number;
  public longitude: number;
  public gender?: number;
  public description: string;
  public title?: string;
  public pathName?: string;
  public isoMarketplace: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
  public readonly openedAt!: Date;
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
      type: DataTypes.ENUM(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE),
      defaultValue: ELocationStatus.ACTIVE
    },
    city: {
      field: 'city',
      type: DataTypes.STRING,
      allowNull: true
    },
    cityId: {
      field: 'cityId',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    district: {
      field: 'district',
      type: DataTypes.STRING,
      allowNull: true
    },
    ward: {
      field: 'ward',
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      field: 'address',
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      field: 'latitude',
      type: DataTypes.STRING,
      defaultValue: 0
    },
    longitude: {
      field: 'longitude',
      type: DataTypes.STRING,
      defaultValue: 0
    },
    description: {
      field: 'description',
      type: DataTypes.STRING,
      allowNull: true
    },
    gender: {
      type: DataTypes.TINYINT,
      field: 'gender',
      defaultValue: 0
    },
    pathName: {
      field: 'path_name',
      type: DataTypes.STRING,
      defaultValue: ''
    },
    title: {
      field: 'title',
      type: DataTypes.STRING,
      defaultValue: ''
    },
    isoMarketplace: {
      field: 'iso_marketplace',
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    openedAt: {
      field: 'opened_at',
      type: 'TIMESTAMP',
      defaultValue: null
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
    tableName: 'location',
    timestamps: true,
    paranoid: true
  }
);

export { LocationModel };
