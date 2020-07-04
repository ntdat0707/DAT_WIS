import { Model, DataTypes, Sequelize } from 'sequelize';

import sequelize from '../configs/db-connector';
class CustomerModel extends Model {
  public id: number;
  public name!: string;
  public email!: string;
  public emailVerifiedAt!: string;
  public password!: string;
  public sex: number;
  public phone!: string;
  public dob!: Date;
  public cityId!: number;
  public districtId!: number;
  public address!: string;
  public isSystem!: boolean;
  public facebookId!: string;
  public googleId!: string;
  public zaloId!: string;
  public active!: number;
  public avatar!: string;
  public rememberToken!: string;
  public allowNotification!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    emailVerifiedAt: { type: DataTypes.STRING, unique: true, field: 'email_verified_at' },
    password: { type: DataTypes.STRING },
    sex: { type: DataTypes.TINYINT, comment: '1: nam, 2: nữ' },
    phone: { type: DataTypes.STRING, unique: true },
    dob: { type: DataTypes.DATEONLY },
    cityId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'city_id'
    },
    districtId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'district_id'
    },
    address: { type: DataTypes.STRING },
    isSystem: {
      type: DataTypes.BOOLEAN,
      field: 'is_system',
      defaultValue: 0,
      comment: 'đăng ký bằng hệ thống'
    },
    facebookId: {
      type: DataTypes.STRING,
      field: 'facebook_id',
      unique: true
    },
    googleId: {
      type: DataTypes.STRING,
      field: 'google_id',
      unique: true
    },
    zaloId: {
      type: DataTypes.STRING,
      field: 'zalo_id',
      unique: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      field: 'active',
      defaultValue: 1,
      allowNull: false
    },
    allowNotification: {
      type: DataTypes.BOOLEAN,
      field: 'allow_notification',
      defaultValue: 0
    },
    rememberToken: {
      type: DataTypes.STRING(255),
      field: 'remember_token',
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
    }
  },
  {
    sequelize: sequelize,
    freezeTableName: true,
    tableName: 'customers',
    scopes: {
      safe: {
        attributes: {
          exclude: ['password']
        }
      }
    }
  }
);

export { CustomerModel };
