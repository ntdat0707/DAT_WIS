import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
class StaffModel extends Model {
  public id: string;
  public firstName!: string;
  public lastName!: string;
  public gender: number;
  public phone: string;
  public password: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public isBusinessAccount: boolean;
  public address: string;
  public color: string;
  public facebookId: string;
  public googleId: string;
  public appleId: string;
  public avatarPath: string;
  public onboardStep: number;
  public staffCode: string;
  public isServiceProvider: boolean;
  public roleId: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

StaffModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password'
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
      type: DataTypes.TINYINT,
      field: 'gender'
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
    isAllowedMarketPlace: {
      type: DataTypes.BOOLEAN,
      field: 'is_allowed_marketplace'
    },
    passportNumber: {
      type: DataTypes.STRING,
      field: 'passport_number'
    },
    isBusinessAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_business_account'
    },
    address: {
      field: 'address',
      type: DataTypes.STRING
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'color'
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'facebook_id'
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'google_id'
    },
    appleId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'apple_id'
    },
    avatarPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_path'
    },
    onboardStep: {
      type: DataTypes.TINYINT,
      field: 'onboard_step',
      allowNull: true
    },
    staffCode: {
      field: 'staff_code',
      type: DataTypes.STRING(125),
      allowNull: true
    },
    isServiceProvider: {
      type: DataTypes.BOOLEAN,
      field: 'is_service_provider',
      defaultValue: false
    },
    roleId: {
      field: 'role_id',
      type: DataTypes.UUIDV4,
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
    tableName: 'staff',
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
export { StaffModel };
