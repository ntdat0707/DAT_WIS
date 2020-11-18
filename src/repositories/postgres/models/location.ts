import { Model, Sequelize, DataTypes } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ELocationStatus } from '../../../utils/consts';

class LocationModel extends Model {
  public id: string;
  public companyId!: string;
  public name!: string;
  public phone!: string;
  public email: string;
  public status!: ELocationStatus;
  public country: string;
  public city: string;
  public district: string;
  public ward: string;
  public province: string;
  public street: string;
  public countryCode: string;
  public cityCode: string;
  public districtCode: string;
  public wardCode: string;
  public provinceCode: string;
  public streetCode: string;
  public address: string;
  public fullAddress: string;
  public latitude: number;
  public longitude: number;
  public description: string;
  public shortDescription: string;
  public title?: string;
  public pathName?: string;
  public placeId?: string;
  public isoMarketplace: boolean;
  //public prefixCode: string;
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
    status: {
      field: 'status',
      type: DataTypes.ENUM(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE),
      defaultValue: ELocationStatus.ACTIVE
    },
    country: {
      field: 'country',
      type: DataTypes.STRING,
      allowNull: true
    },
    countryCode: {
      field: 'country_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      field: 'city',
      type: DataTypes.STRING,
      allowNull: true
    },
    cityCode: {
      field: 'city_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      field: 'province',
      type: DataTypes.STRING,
      allowNull: true
    },
    provinceCode: {
      field: 'province_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    district: {
      field: 'district',
      type: DataTypes.STRING,
      allowNull: true
    },
    districtCode: {
      field: 'district_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    ward: {
      field: 'ward',
      type: DataTypes.STRING,
      allowNull: true
    },
    wardCode: {
      field: 'ward_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    street: {
      field: 'street',
      type: DataTypes.STRING,
      allowNull: true
    },
    streetCode: {
      field: 'street_code',
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      field: 'address',
      type: DataTypes.STRING,
      allowNull: true
    },
    fullAddress: {
      field: 'full_address',
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
    shortDescription: {
      field: 'short_description',
      type: DataTypes.STRING,
      allowNull: true
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
    // prefixCode: {
    //   field: 'prefix_code',
    //   type: DataTypes.STRING,
    //   unique: true,
    //   allowNull: true
    // },
    openedAt: {
      field: 'opened_at',
      type: 'TIMESTAMP',
      defaultValue: null
    },
    placeId: {
      field: 'place_id',
      type: DataTypes.STRING,
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
    tableName: 'location',
    timestamps: true,
    paranoid: true
  }
);

export { LocationModel };
