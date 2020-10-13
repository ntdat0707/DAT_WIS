import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EGender } from '../../../utils/consts';
class CustomerModel extends Model {
  public id: string;
  public firstName!: string;
  public lastName!: string;
  public gender: number;
  public phone!: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public address: string;
  public companyId!: string;
  public password!: string;
  public otpCode: string;
  public facebookId: string;
  public googleId: string;
  public appleId: string;
  public avatarPath: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CustomerModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    gender: {
      type: DataTypes.ENUM(...Object.keys(EGender)),
      field: 'gender',
      allowNull: false,
      defaultValue: EGender.UNISEX
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone'
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'email'
    },
    birthDate: {
      type: DataTypes.DATE,
      field: 'birth_date'
    },
    passportNumber: {
      type: DataTypes.STRING,
      field: 'passport_number'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password'
    },
    otpCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'otp_code'
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'facebook_id'
    },
    appleId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'apple_id'
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'google_id'
    },
    avatarPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_path'
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
    tableName: 'customer',
    scopes: {
      safe: {
        attributes: {
          exclude: ['password']
        }
      }
    },
    timestamps: true,
    paranoid: true
  }
);

export { CustomerModel };
